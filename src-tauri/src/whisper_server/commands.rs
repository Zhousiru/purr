use crate::{error::CommandResult, utils::dir_size};
use std::fs::read_dir;

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
