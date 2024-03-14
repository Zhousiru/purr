use std::fs::read_dir;

use anyhow::anyhow;
use tauri::{async_runtime::spawn_blocking, AppHandle, State};

use super::{
  daemon::spawn_daemon,
  utils::{submit_task, TaskOptions},
};
use crate::{error::CommandResult, utils::dir_size, WhisperServerDaemon};

#[derive(Debug, serde::Serialize)]
pub struct ModelItem {
  name: String,
  size: u64,
}

#[tauri::command]
pub async fn list_models(path: &str) -> CommandResult<Vec<ModelItem>> {
  let entries = read_dir(path)?;
  let mut models: Vec<ModelItem> = Vec::new();

  for entry in entries {
    let entry = entry?;
    let metadata = entry.metadata()?;

    if !metadata.is_dir() {
      continue;
    }

    models.push(ModelItem {
      name: entry.file_name().to_string_lossy().into(),
      size: dir_size(entry.path())?,
    })
  }

  Ok(models.into())
}

#[tauri::command]
pub async fn launch_whisper_server(
  app: AppHandle,
  daemon: State<'_, WhisperServerDaemon>,
  base_path: String,
  args: Vec<String>,
) -> CommandResult<()> {
  let mut daemon = daemon.0.lock().unwrap();
  match *daemon {
    None => {
      *daemon = Some(spawn_daemon(base_path, args, app));
      Ok(())
    }
    Some(_) => Err(anyhow!("whisper server is already running").into()),
  }
}

#[tauri::command]
pub async fn is_whisper_server_running(
  daemon: State<'_, WhisperServerDaemon>,
) -> CommandResult<bool> {
  let daemon = daemon.0.lock().unwrap();
  Ok(daemon.is_some())
}

#[tauri::command]
pub async fn kill_whisper_server(daemon: State<'_, WhisperServerDaemon>) -> CommandResult<()> {
  let daemon = daemon.0.lock().unwrap();
  match *daemon {
    Some(ref daemon) => {
      daemon.kill();
      Ok(())
    }
    None => Err(anyhow!("whisper server is not running").into()),
  }
}

#[derive(Debug, serde::Serialize)]
pub struct TaskSubmissionResult {
  name: String,
  path: String,
  error: Option<String>,
}

#[tauri::command]
pub async fn submit_transcription_task(
  url: String,
  name: String,
  path: String,
  options: TaskOptions,
) -> CommandResult<()> {
  spawn_blocking(move || submit_task(&url, &name, &path, &options)).await?
}
