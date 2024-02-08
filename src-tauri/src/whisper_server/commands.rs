use super::daemon::spawn_daemon;
use crate::{error::CommandResult, utils::dir_size, WhisperServerDaemon};
use anyhow::anyhow;
use std::fs::read_dir;
use tauri::{AppHandle, State};

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
  program: String,
  args: Vec<String>,
) -> CommandResult<()> {
  let mut daemon = daemon.0.lock().unwrap();
  match *daemon {
    None => {
      *daemon = Some(spawn_daemon(program, args, app));
      Ok(())
    }
    Some(_) => Err(anyhow!("whisper server is already running").into()),
  }
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
