use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProgressStatus {
  Downloading,
  Finished,
  Error,
  #[serde(other)]
  Unknown,
}

/// Event payload emitted on `event_name::YT_DLP_DOWNLOAD`. Shape is mirrored
/// in `src/types/commands.ts`. The frontend groups progress bars by `ext`;
/// the synthetic `finished()` event uses an empty ext so the UI can skip it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
  pub status: ProgressStatus,
  pub ext: String,
  pub percent: f64,
}

impl DownloadProgress {
  pub fn finished() -> Self {
    Self {
      status: ProgressStatus::Finished,
      ext: String::new(),
      percent: 100.0,
    }
  }
}
