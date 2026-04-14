use std::collections::HashMap;
use std::sync::Arc;

use tauri::State;

use crate::error::CommandResult;

use super::manager::BinManager;
use super::status::BinaryStatus;

#[tauri::command]
pub async fn get_binary_statuses(
  manager: State<'_, Arc<BinManager>>,
) -> CommandResult<HashMap<String, BinaryStatus>> {
  Ok(manager.snapshot_statuses())
}

#[tauri::command]
pub async fn retry_binary(
  id: String,
  manager: State<'_, Arc<BinManager>>,
) -> CommandResult<()> {
  manager.retry(&id)?;
  Ok(())
}
