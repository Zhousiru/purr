use std::path::PathBuf;
use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};
use tokio::sync::Notify;

use crate::bin_manager::BinManager;
use crate::error::CommandResult;
use crate::event_name;

use super::events::DownloadProgress;
use super::runner::SubprocessRunner;
use super::state::YtDlpState;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UrlMetadata {
  pub title: String,
  pub duration: Option<f64>,
  pub uploader: Option<String>,
  pub thumbnail: Option<String>,
  pub webpage_url: Option<String>,
  pub is_live: bool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResult {
  pub path: String,
  pub duration: f64,
  pub title: String,
}

fn sanitize_filename(name: &str) -> String {
  name
    .chars()
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
  manager: State<'_, Arc<BinManager>>,
) -> CommandResult<UrlMetadata> {
  let runner = SubprocessRunner::from_manager(&manager).await?;
  let info = runner.dump_json(&url).await?;
  Ok(UrlMetadata {
    title: info.title.clone(),
    duration: info.duration,
    uploader: info.display_uploader(),
    thumbnail: info.thumbnail.clone(),
    webpage_url: info.webpage_url.clone(),
    is_live: info.is_live(),
  })
}

#[tauri::command]
pub async fn download_from_url(
  url: String,
  output_dir: String,
  audio_only: bool,
  app: AppHandle,
  manager: State<'_, Arc<BinManager>>,
  yt_dlp_state: State<'_, YtDlpState>,
) -> CommandResult<DownloadResult> {
  let runner = SubprocessRunner::from_manager(&manager).await?;

  // Fetch metadata first: we need the title for the filename, the duration
  // for the waveform sizing, and the id for the isolated work dir.
  let info = runner.dump_json(&url).await?;
  let duration = info.duration.unwrap_or(0.0);
  let title = info.title.clone();
  let safe_title = sanitize_filename(&title);

  // Isolate every artifact yt-dlp produces inside a per-video subfolder so
  // cancel cleanup is a single `remove_dir_all` regardless of which files
  // (.part, intermediate merges, .ytdl, etc.) happen to exist at the time.
  let parent_dir = PathBuf::from(&output_dir);
  tokio::fs::create_dir_all(&parent_dir).await?;
  let work_dir = parent_dir.join(format!(".purr-{}", info.id));
  tokio::fs::create_dir_all(&work_dir).await?;

  let output_template = work_dir
    .join(format!("{safe_title}.%(ext)s"))
    .to_string_lossy()
    .into_owned();

  // Fresh cancel handle per download; overwrites any previous slot — the UI
  // only permits one download at a time so this is safe.
  let cancel = Arc::new(Notify::new());
  {
    let mut slot = yt_dlp_state.0.lock().unwrap();
    *slot = Some(cancel.clone());
  }

  let emit_app = app.clone();
  let runner_result = runner
    .download(
      &url,
      &output_template,
      audio_only,
      cancel.clone(),
      move |progress: DownloadProgress| {
        let _ = emit_app.emit(event_name::YT_DLP_DOWNLOAD, progress);
      },
    )
    .await;

  // Clear the cancel slot regardless of outcome.
  {
    let mut slot = yt_dlp_state.0.lock().unwrap();
    *slot = None;
  }

  match runner_result {
    Ok(downloaded) => {
      // Move the final file out of the work dir into the user-facing output
      // directory, then drop the work dir entirely.
      let file_name = downloaded
        .path
        .file_name()
        .map(|s| s.to_owned())
        .ok_or_else(|| anyhow::anyhow!("downloaded file has no name"))?;
      let final_path = parent_dir.join(&file_name);
      tokio::fs::rename(&downloaded.path, &final_path).await?;
      let _ = tokio::fs::remove_dir_all(&work_dir).await;

      Ok(DownloadResult {
        path: final_path.to_string_lossy().into_owned(),
        duration,
        title,
      })
    }
    Err(e) => {
      // Cancelled or failed — nuke the work dir so no partials leak.
      let _ = tokio::fs::remove_dir_all(&work_dir).await;
      Err(e.into())
    }
  }
}

#[tauri::command]
pub async fn cancel_download(state: State<'_, YtDlpState>) -> CommandResult<()> {
  let notify = {
    let slot = state.0.lock().unwrap();
    slot.clone()
  };
  if let Some(notify) = notify {
    notify.notify_one();
  }
  Ok(())
}
