#![allow(dead_code)]

use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;

use serde::Deserialize;
use tokio::io::{AsyncRead, AsyncReadExt};
use tokio::process::Command;
use tokio::sync::Notify;

use crate::bin_manager::BinManager;

use super::events::{DownloadProgress, ProgressStatus};

/// Wraps invocations of the yt-dlp binary via `tokio::process`. Short-lived —
/// construct one per command via `from_manager`.
pub struct SubprocessRunner {
  yt_dlp: PathBuf,
  ffmpeg_dir: Option<PathBuf>,
}

/// Prefix used by our `--progress-template` so we can pick progress lines out
/// of yt-dlp's banner chatter without parsing JSON.
const PROGRESS_MARKER: &str = ">purr>";

impl SubprocessRunner {
  pub fn new(yt_dlp: PathBuf, ffmpeg_dir: Option<PathBuf>) -> Self {
    Self { yt_dlp, ffmpeg_dir }
  }

  /// Build a runner from the shared `BinManager`. Ensures both binaries are
  /// installed (first-run lazy init) before returning.
  pub async fn from_manager(manager: &BinManager) -> anyhow::Result<Self> {
    manager.ensure_all().await?;
    let yt_dlp = manager.exe("yt-dlp", "yt-dlp").await?;
    let ffmpeg_dir = manager.dir("ffmpeg").await.ok();
    Ok(Self::new(yt_dlp, ffmpeg_dir))
  }

  fn base_command(&self) -> Command {
    let mut cmd = Command::new(&self.yt_dlp);
    cmd.stdin(Stdio::null()).kill_on_drop(true);

    // yt-dlp is a PyInstaller-frozen Python app that block-buffers stdout
    // when it isn't attached to a TTY. `PYTHONUNBUFFERED=1` forces
    // line-level flushing so progress arrives in real time.
    cmd.env("PYTHONUNBUFFERED", "1");

    // Suppress the console popup that would otherwise flash on Windows in
    // release (GUI-subsystem) builds. 0x0800_0000 = CREATE_NO_WINDOW.
    #[cfg(windows)]
    cmd.creation_flags(0x0800_0000);

    cmd
  }

  /// Run `yt-dlp -J <url>` and deserialize the result. Fails cleanly with the
  /// yt-dlp stderr message when the process exits non-zero.
  pub async fn dump_json(&self, url: &str) -> anyhow::Result<RawVideoInfo> {
    let output = self
      .base_command()
      .args(["-J", "--no-warnings", "--no-download", url])
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .output()
      .await?;

    if !output.status.success() {
      let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
      anyhow::bail!("yt-dlp failed: {stderr}");
    }

    let info: RawVideoInfo = serde_json::from_slice(&output.stdout)
      .map_err(|e| anyhow::anyhow!("failed to parse yt-dlp JSON: {e}"))?;
    Ok(info)
  }

  /// Download the URL into `output_template`. When `audio_only` is true the
  /// result is an `.m4a`; otherwise it's a 720p-preferred `.mp4`. Progress is
  /// streamed through `on_progress`. Awaiting `cancel.notified()` from any
  /// task kills the child and returns the sentinel error `"cancelled"`.
  pub async fn download<F>(
    &self,
    url: &str,
    output_template: &str,
    audio_only: bool,
    cancel: Arc<Notify>,
    on_progress: F,
  ) -> anyhow::Result<DownloadedFile>
  where
    F: Fn(DownloadProgress) + Send + Sync + 'static,
  {
    let ffmpeg_dir = self
      .ffmpeg_dir
      .as_ref()
      .ok_or_else(|| anyhow::anyhow!("ffmpeg directory not resolved"))?;

    let ffmpeg_dir_str = ffmpeg_dir.to_string_lossy().into_owned();
    let progress_tmpl = format!(
      "{PROGRESS_MARKER}%(progress.status)s %(info.ext)s %(progress._percent).1f"
    );

    // Two arg sets share most options; build a base vec and splice in the
    // format-selection flags based on `audio_only`.
    let mut args: Vec<&str> = Vec::with_capacity(20);
    if audio_only {
      args.extend_from_slice(&[
        "-f",
        "bestaudio[ext=m4a]/bestaudio",
        "-x",
        "--audio-format",
        "m4a",
      ]);
    } else {
      args.extend_from_slice(&[
        "-S",
        "res:720,ext:mp4:m4a,vcodec:h264,acodec:aac",
        "--recode-video",
        "mp4",
      ]);
    }
    args.extend_from_slice(&[
      "--ffmpeg-location",
      ffmpeg_dir_str.as_str(),
      "-o",
      output_template,
      "--newline",
      "--no-warnings",
      "--progress-template",
      progress_tmpl.as_str(),
      "--progress-delta",
      "0.5",
      url,
    ]);

    let mut child = self
      .base_command()
      .args(&args)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .spawn()?;

    let stdout = child.stdout.take().expect("piped stdout");
    let stderr = child.stderr.take().expect("piped stderr");

    // yt-dlp emits download progress with `\r` terminators rather than `\n`,
    // even under `--progress-template`, so a plain `BufReader::lines()` never
    // yields them. Both streams are drained into one channel and split on
    // either CR or LF; we just parse any line prefixed with `PROGRESS_MARKER`.
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    let stderr_task = tokio::spawn(read_crlf_lines(stderr, tx.clone()));
    let stdout_task = tokio::spawn(read_crlf_lines(stdout, tx));

    // Pinned `notified()` future so we can poll it repeatedly in the select.
    let cancelled = cancel.notified();
    tokio::pin!(cancelled);

    let mut diag = String::new();
    let mut was_cancelled = false;
    loop {
      tokio::select! {
        biased;
        _ = &mut cancelled => {
          let _ = child.kill().await;
          was_cancelled = true;
          break;
        }
        maybe = rx.recv() => {
          let Some(line) = maybe else { break };
          diag.push_str(&line);
          diag.push('\n');
          if let Some(rest) = line.trim_start().strip_prefix(PROGRESS_MARKER) {
            if let Some(progress) = parse_progress(rest) {
              on_progress(progress);
            }
          }
        }
      }
    }

    let _ = stdout_task.await;
    let _ = stderr_task.await;

    let status = child.wait().await?;

    if was_cancelled {
      anyhow::bail!("cancelled");
    }
    if !status.success() {
      anyhow::bail!("yt-dlp download failed: {}", diag.trim());
    }

    // Synthetic final event so the frontend sees a definitive 100% regardless
    // of which stream yt-dlp happened to finish on.
    on_progress(DownloadProgress::finished());

    let final_ext = if audio_only { "m4a" } else { "mp4" };
    let path = derive_expected_path(output_template, final_ext)
      .filter(|p| p.exists())
      .or_else(|| find_by_stem(output_template))
      .ok_or_else(|| {
        anyhow::anyhow!(
          "yt-dlp exited cleanly but no output file was found (template: {output_template})"
        )
      })?;

    Ok(DownloadedFile { path })
  }
}

/// Read bytes from `reader` and push each line over `tx`, splitting on
/// either `\r` or `\n`. yt-dlp's progress updates are CR-terminated, which
/// `BufReader::lines()` would silently collapse, so we do the splitting by
/// hand.
async fn read_crlf_lines<R>(mut reader: R, tx: tokio::sync::mpsc::UnboundedSender<String>)
where
  R: AsyncRead + Unpin,
{
  let mut buf = [0u8; 4096];
  let mut pending: Vec<u8> = Vec::new();
  loop {
    let n = match reader.read(&mut buf).await {
      Ok(0) | Err(_) => break,
      Ok(n) => n,
    };
    for &byte in &buf[..n] {
      if byte == b'\n' || byte == b'\r' {
        if !pending.is_empty() {
          let line = String::from_utf8_lossy(&pending).into_owned();
          pending.clear();
          if tx.send(line).is_err() {
            return;
          }
        }
      } else {
        pending.push(byte);
      }
    }
  }
  if !pending.is_empty() {
    let _ = tx.send(String::from_utf8_lossy(&pending).into_owned());
  }
}

/// Parse a single progress line body (the text after `>purr>`). Format:
/// `<status> <ext> <percent>` — e.g. `downloading mp4 42.7`.
fn parse_progress(body: &str) -> Option<DownloadProgress> {
  let mut parts = body.split_whitespace();
  let status = parts.next()?;
  let ext = parts.next()?;
  let percent: f64 = parts.next()?.parse().ok()?;
  let status = match status {
    "downloading" => ProgressStatus::Downloading,
    "finished" => ProgressStatus::Finished,
    "error" => ProgressStatus::Error,
    _ => ProgressStatus::Unknown,
  };
  Some(DownloadProgress {
    status,
    ext: ext.to_string(),
    percent,
  })
}

/// Swap the trailing `%(ext)s` in a yt-dlp output template with `final_ext`.
fn derive_expected_path(output_template: &str, final_ext: &str) -> Option<PathBuf> {
  let stem = output_template.strip_suffix(".%(ext)s")?;
  Some(PathBuf::from(format!("{stem}.{final_ext}")))
}

/// Fallback when the expected path doesn't exist: scan the template's parent
/// directory for any file whose name starts with the template's basename
/// stem. Covers cases where yt-dlp trimmed or reshaped the filename further.
fn find_by_stem(output_template: &str) -> Option<PathBuf> {
  let stem_template = output_template.strip_suffix(".%(ext)s")?;
  let template_path = PathBuf::from(stem_template);
  let dir = template_path.parent()?;
  let needle = template_path.file_name()?.to_string_lossy().into_owned();
  let mut entries = std::fs::read_dir(dir).ok()?;
  entries.find_map(|entry| {
    let entry = entry.ok()?;
    let name = entry.file_name().to_string_lossy().into_owned();
    if name.starts_with(&needle) {
      Some(entry.path())
    } else {
      None
    }
  })
}

pub struct DownloadedFile {
  pub path: PathBuf,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RawVideoInfo {
  pub id: String,
  pub title: String,
  #[serde(default)]
  pub duration: Option<f64>,
  #[serde(default)]
  pub channel: Option<String>,
  #[serde(default)]
  pub uploader: Option<String>,
  #[serde(default)]
  pub upload_date: Option<String>,
  #[serde(default)]
  pub thumbnail: Option<String>,
  #[serde(default)]
  pub webpage_url: Option<String>,
  #[serde(default)]
  pub ext: Option<String>,
  #[serde(default)]
  pub filesize_approx: Option<u64>,
  #[serde(default)]
  pub is_live: Option<bool>,
  #[serde(default)]
  pub live_status: Option<String>,
  #[serde(default)]
  pub formats: serde_json::Value,
  #[serde(default)]
  pub thumbnails: serde_json::Value,
  #[serde(default)]
  pub subtitles: serde_json::Value,
}

impl RawVideoInfo {
  /// Prefer `channel` (YouTube-style display name); fall back to `uploader`.
  pub fn display_uploader(&self) -> Option<String> {
    self.channel.clone().or_else(|| self.uploader.clone())
  }

  pub fn is_live(&self) -> bool {
    self.is_live.unwrap_or(false)
      || matches!(self.live_status.as_deref(), Some("is_live" | "is_upcoming"))
  }
}
