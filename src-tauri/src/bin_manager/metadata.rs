#![allow(dead_code)]

use std::collections::HashMap;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionEntry {
  pub version: String,
  pub installed_at: u64,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub sha256: Option<String>,
}

pub type VersionMap = HashMap<String, VersionEntry>;

const FILENAME: &str = "version.json";

fn file_path(bin_dir: &Path) -> std::path::PathBuf {
  bin_dir.join(FILENAME)
}

pub async fn load(bin_dir: &Path) -> anyhow::Result<VersionMap> {
  let p = file_path(bin_dir);
  match tokio::fs::read(&p).await {
    Ok(bytes) => match serde_json::from_slice::<VersionMap>(&bytes) {
      Ok(map) => Ok(map),
      Err(e) => {
        eprintln!("[bin_manager] version.json corrupt, starting fresh: {e}");
        Ok(HashMap::new())
      }
    },
    Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(HashMap::new()),
    Err(e) => Err(e.into()),
  }
}

pub async fn save(bin_dir: &Path, data: &VersionMap) -> anyhow::Result<()> {
  tokio::fs::create_dir_all(bin_dir).await?;
  let p = file_path(bin_dir);
  let tmp = p.with_extension("json.tmp");
  let bytes = serde_json::to_vec_pretty(data)?;
  tokio::fs::write(&tmp, bytes).await?;
  tokio::fs::rename(&tmp, &p).await?;
  Ok(())
}

pub fn now() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_secs())
    .unwrap_or(0)
}
