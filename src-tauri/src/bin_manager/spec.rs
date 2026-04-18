use std::collections::HashMap;
use std::path::{Path, PathBuf};

use async_trait::async_trait;
use serde::Serialize;

// Re-exported by the parent module; `BinarySource` is also carried in
// `BinaryStatus::Ready` which is why it needs to serialize as camelCase.

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum BinarySource {
  Managed,
  SystemPath,
}

#[derive(Debug, Clone)]
pub struct ResolvedBinary {
  pub source: BinarySource,
  pub executables: HashMap<&'static str, PathBuf>,
}

impl ResolvedBinary {
  pub fn dir(&self) -> Option<&Path> {
    self.executables.values().next().and_then(|p| p.parent())
  }
}

#[derive(Debug, Clone)]
pub struct ReleaseAsset {
  pub name: String,
  pub url: String,
}

#[derive(Debug, Clone)]
pub struct ReleaseInfo {
  pub version: String,
  pub assets: Vec<ReleaseAsset>,
}

/// Byte-level install progress callback. Specs invoke it once per downloaded
/// chunk; the install runner installs a throttled wrapper that forwards into
/// the notification + status pipelines. The `'a` parameter lets the runner
/// pass a closure that borrows from its own stack frame.
pub type ProgressFn<'a> = dyn Fn(u64, Option<u64>) + Send + Sync + 'a;

/// Each managed binary implements this trait in its own submodule under
/// `bin_manager/<id>/`. The manager is generic over the trait and knows
/// nothing binary-specific.
#[async_trait]
pub trait BinarySpec: Send + Sync + 'static {
  /// Stable identifier, used as key in version.json and the manager state.
  fn id(&self) -> &'static str;

  /// Human-readable label for user-facing copy (notification titles, error
  /// messages). Defaults to `id()`, which is fine for already-presentable
  /// ids like `yt-dlp`; specs with awkward ids (e.g. `ffmpeg → FFmpeg`)
  /// override.
  fn display_name(&self) -> &'static str {
    self.id()
  }

  /// Executable base names this spec owns. `.exe` is added by the manager
  /// on Windows. yt-dlp → `["yt-dlp"]`; ffmpeg → `["ffmpeg", "ffprobe"]`.
  fn provides(&self) -> &'static [&'static str];

  /// If true, resolution falls back to probing `$PATH` when the managed copy
  /// is missing. Managed copy still wins when it exists.
  fn probe_path(&self) -> bool;

  /// If true, the manager spawns a background update task after `ensure_all`.
  fn auto_update(&self) -> bool;

  /// Fetch the latest release metadata. Called during first-run install and
  /// by the background updater. May hit the network.
  async fn fetch_latest(&self, http: &reqwest::Client) -> anyhow::Result<ReleaseInfo>;

  /// Install the given release into `bin_dir`. The spec picks the right asset
  /// for the current platform, verifies checksums, and writes executables at
  /// `bin_dir/<provides()[i]>[.exe]`. `on_progress` is called by specs that
  /// support byte-level progress reporting; specs that can't may ignore it.
  async fn install(
    &self,
    http: &reqwest::Client,
    release: &ReleaseInfo,
    bin_dir: &Path,
    on_progress: &ProgressFn<'_>,
  ) -> anyhow::Result<()>;
}

pub fn executable_name(base: &str) -> String {
  if cfg!(windows) {
    format!("{base}.exe")
  } else {
    base.to_string()
  }
}
