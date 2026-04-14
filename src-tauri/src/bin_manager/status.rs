use serde::Serialize;

use super::spec::{BinarySource, ResolvedBinary};

/// Per-binary readiness state exposed to the frontend. Transitions:
///
/// - ffmpeg (non-auto-update), fresh:
///   `NotInstalled → Installing → Ready`
/// - ffmpeg, existing on disk or on `$PATH`: seeded directly as `Ready`.
/// - yt-dlp (auto-update), fresh:
///   `NotInstalled → Installing → Ready` (fresh install fetches latest, so
///   we skip `Installed`/`CheckingUpdate`).
/// - yt-dlp, existing on disk at startup:
///   `Installed → CheckingUpdate → Ready` (or `Updating → Ready`).
/// - Any failure: `Failed { retryable: true }`, eligible for `retry_binary`.
///
/// `Installed` means "on disk but session-level update probe has not
/// completed yet". Only auto-update specs use this intermediate state.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "state", rename_all = "camelCase")]
pub enum BinaryStatus {
  NotInstalled,
  Installing {
    progress: Option<f32>,
  },
  Installed {
    version: String,
  },
  CheckingUpdate {
    version: String,
  },
  Updating {
    version_from: String,
    progress: Option<f32>,
  },
  Ready {
    version: String,
    source: BinarySource,
  },
  Failed {
    error: String,
    retryable: bool,
  },
}

/// Emitted on every status transition over `event_name::BINARY_STATUS`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BinaryStatusEvent {
  pub id: String,
  pub status: BinaryStatus,
}

/// Distinguishes a first-time install from an update run. The install runner
/// uses this to pick notification titles and status variants.
#[derive(Debug, Clone)]
pub enum InstallPhase {
  First,
  Update { from_version: String },
}

/// Unified per-binary record. The invariant is that `status == Ready`
/// implies `resolved.is_some()`; callers treat the pair atomically by going
/// through `BinManager::set_status` / `set_record`.
#[derive(Debug, Clone)]
pub struct BinaryRecord {
  pub status: BinaryStatus,
  pub resolved: Option<ResolvedBinary>,
}

impl BinaryRecord {
  pub fn new(status: BinaryStatus) -> Self {
    Self {
      status,
      resolved: None,
    }
  }
}
