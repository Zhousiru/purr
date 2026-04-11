use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};

use tauri::{AppHandle, Emitter, Manager, State};

use crate::error::CommandResult;
use crate::event_name;

use super::events::DownloadProgress;
use super::state::{ensure_binaries, YtDlpState};

/// Our own metadata struct with f64 duration (yt-dlp returns floats).
#[derive(serde::Deserialize)]
struct VideoInfo {
    title: String,
    duration: Option<f64>,
    channel: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UrlMetadata {
    pub title: String,
    pub duration: Option<f64>,
    pub uploader: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResult {
    pub path: String,
    pub duration: f64,
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

#[tauri::command]
pub async fn fetch_url_metadata(
    url: String,
    app: AppHandle,
    state: State<'_, YtDlpState>,
) -> CommandResult<UrlMetadata> {
    let app_data_dir = app.path().app_data_dir()?;
    ensure_binaries(app_data_dir, &state).await?;

    let guard = state.0.lock().await;
    let bins = guard.as_ref().unwrap();
    let yt_dlp_path = bins.yt_dlp.clone();
    drop(guard);

    // Run yt-dlp --dump-json to get metadata without downloading
    let output = tokio::task::spawn_blocking(move || {
        Command::new(&yt_dlp_path)
            .args(["--dump-json", "--no-download", &url])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .output()
    })
    .await
    .map_err(|e| anyhow::anyhow!("Task join error: {}", e))?
    .map_err(|e| anyhow::anyhow!("Failed to run yt-dlp: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("yt-dlp failed: {}", stderr).into());
    }

    let info: VideoInfo = serde_json::from_slice(&output.stdout)
        .map_err(|e| anyhow::anyhow!("Failed to parse video info: {}", e))?;

    Ok(UrlMetadata {
        title: info.title,
        duration: info.duration,
        uploader: info.channel,
    })
}

#[tauri::command]
pub async fn download_audio_from_url(
    url: String,
    output_dir: String,
    app: AppHandle,
    state: State<'_, YtDlpState>,
) -> CommandResult<DownloadResult> {
    let app_data_dir = app.path().app_data_dir()?;
    ensure_binaries(app_data_dir, &state).await?;

    let guard = state.0.lock().await;
    let bins = guard.as_ref().unwrap();
    let yt_dlp_path = bins.yt_dlp.clone();
    let ffmpeg_path = bins.ffmpeg.clone();
    drop(guard);

    // First fetch metadata for title and duration
    let meta_output = tokio::task::spawn_blocking({
        let yt_dlp_path = yt_dlp_path.clone();
        let url = url.clone();
        move || {
            Command::new(&yt_dlp_path)
                .args(["--dump-json", "--no-download", &url])
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .output()
        }
    })
    .await
    .map_err(|e| anyhow::anyhow!("Task join error: {}", e))?
    .map_err(|e| anyhow::anyhow!("Failed to run yt-dlp: {}", e))?;

    let info: VideoInfo = serde_json::from_slice(&meta_output.stdout)
        .map_err(|e| anyhow::anyhow!("Failed to parse video info: {}", e))?;

    let duration = info.duration.unwrap_or(0.0);
    let safe_title = sanitize_filename(&info.title);

    let dir = PathBuf::from(&output_dir);
    std::fs::create_dir_all(&dir)?;

    // Output template: yt-dlp will replace %(ext)s with the actual extension
    let output_template = dir.join(&safe_title).to_string_lossy().to_string();

    // Spawn yt-dlp process for audio extraction with progress on stderr
    let result_path = tokio::task::spawn_blocking({
        let app = app.clone();
        move || -> anyhow::Result<String> {
            let mut child = Command::new(&yt_dlp_path)
                .args([
                    "-x",
                    "--audio-format", "m4a",
                    "--ffmpeg-location",
                    &ffmpeg_path.parent().unwrap().to_string_lossy(),
                    "-o",
                    &format!("{}.%(ext)s", output_template),
                    "--newline", // Each progress line on its own line
                    &url,
                ])
                .stdout(Stdio::null())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| anyhow::anyhow!("Failed to spawn yt-dlp: {}", e))?;

            // Parse progress from stderr
            if let Some(stderr) = child.stderr.take() {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    let line = line.unwrap_or_default();
                    // yt-dlp progress lines look like:
                    // [download]  45.2% of  10.00MiB at  2.00MiB/s ETA 00:04
                    if line.contains("[download]") && line.contains('%') {
                        if let Some(pct) = parse_progress(&line) {
                            app.emit(
                                event_name::YT_DLP_DOWNLOAD,
                                DownloadProgress {
                                    downloaded: (pct * 100.0) as u64,
                                    total: 10000,
                                },
                            )
                            .ok();
                        }
                    }
                }
            }

            let status = child.wait()?;
            if !status.success() {
                return Err(anyhow::anyhow!("yt-dlp download failed"));
            }

            // Find the output file (yt-dlp may produce .m4a)
            let expected = format!("{}.m4a", output_template);
            if std::path::Path::new(&expected).exists() {
                return Ok(expected);
            }

            // Fallback: look for any file with the safe_title prefix
            for entry in std::fs::read_dir(&dir)? {
                let entry = entry?;
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with(&safe_title) {
                    return Ok(entry.path().to_string_lossy().to_string());
                }
            }

            Err(anyhow::anyhow!("Downloaded file not found"))
        }
    })
    .await
    .map_err(|e| anyhow::anyhow!("Task join error: {}", e))??;

    // Emit 100% progress
    app.emit(
        event_name::YT_DLP_DOWNLOAD,
        DownloadProgress {
            downloaded: 10000,
            total: 10000,
        },
    )
    .ok();

    Ok(DownloadResult {
        path: result_path,
        duration,
    })
}

/// Parse a percentage from a yt-dlp progress line.
/// e.g. "[download]  45.2% of ..." -> Some(0.452)
fn parse_progress(line: &str) -> Option<f64> {
    let line = line.trim();
    // Find the percentage value before the '%' sign
    let pct_idx = line.find('%')?;
    let before = &line[..pct_idx];
    // Walk backwards to find the start of the number
    let num_start = before.rfind(|c: char| !c.is_ascii_digit() && c != '.')? + 1;
    let num_str = &before[num_start..];
    let pct: f64 = num_str.parse().ok()?;
    Some(pct / 100.0)
}
