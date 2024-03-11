use super::{
  daemon::spawn_daemon,
  utils::{submit_task, NamedPath, TaskOptions},
};
use crate::{error::CommandResult, utils::dir_size, WhisperServerDaemon};
use anyhow::anyhow;
use rayon::prelude::*;
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

#[derive(Debug, serde::Serialize)]
pub struct TaskSubmissionResult {
  name: String,
  path: String,
  error: Option<String>,
}

#[tauri::command]
pub async fn submit_transcription_task(
  url: String,
  named_paths: Vec<NamedPath>,
  options: TaskOptions,
) -> Vec<TaskSubmissionResult> {
  let client = reqwest::blocking::Client::new();

  named_paths
    .par_iter()
    .map(
      |named_path| match submit_task(&client, &url, named_path, &options) {
        Ok(()) => TaskSubmissionResult {
          name: named_path.name.clone(),
          path: named_path.path.clone(),
          error: None,
        },
        Err(e) => TaskSubmissionResult {
          name: named_path.name.clone(),
          path: named_path.path.clone(),
          error: Some(e.to_string()),
        },
      },
    )
    .collect()
}
