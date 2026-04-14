#![allow(dead_code)]

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex as StdMutex};
use std::time::{Duration, Instant};

use async_trait::async_trait;
use tauri::AppHandle;
use tokio::sync::{Mutex, RwLock};

use crate::notify::{self, Notification, NotificationType};

pub mod download;
pub mod metadata;
pub mod path_probe;

pub mod ffmpeg;
pub mod yt_dlp;

/// Callback type for byte-level install progress. Specs invoke this once per
/// downloaded chunk; `BinManager` installs a throttled wrapper that forwards
/// into the notification helper.
pub type ProgressFn = dyn Fn(u64, Option<u64>) + Send + Sync;

/// Minimum gap between notification progress updates. Each chunk from yt-dlp
/// arrives in ~8 KiB increments — without throttling the event channel
/// spams at tens of emits/sec.
const PROGRESS_THROTTLE: Duration = Duration::from_millis(200);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
  pub fn exe(&self, name: &str) -> Option<&Path> {
    self.executables.get(name).map(|p| p.as_path())
  }

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
  pub checksums: Option<HashMap<String, String>>,
}

/// Each managed binary implements this trait in its own submodule under
/// `bin_manager/<id>/`. The manager is generic over the trait and knows
/// nothing binary-specific.
#[async_trait]
pub trait BinarySpec: Send + Sync + 'static {
  /// Stable identifier, used as key in version.json and the manager cache.
  fn id(&self) -> &'static str;

  /// Executable base names this spec owns. `.exe` is added by the manager
  /// on Windows. yt-dlp → `["yt-dlp"]`; ffmpeg → `["ffmpeg", "ffprobe"]`.
  fn provides(&self) -> &'static [&'static str];

  /// If true, `resolve()` falls back to probing PATH when the managed copy
  /// is missing. Managed copy still wins when it exists.
  fn probe_path(&self) -> bool;

  /// If true, the manager spawns a background update task after ensure_all.
  fn auto_update(&self) -> bool;

  /// Fetch the latest release metadata. Called during first-run install and
  /// by the background updater. May hit the network.
  async fn fetch_latest(&self, http: &reqwest::Client) -> anyhow::Result<ReleaseInfo>;

  /// Install the given release into `bin_dir`. The spec picks the right
  /// asset for the current platform, verifies checksums, and writes the
  /// executable(s) at `bin_dir/<provides()[i]>[.exe]`. `on_progress` is
  /// called by specs that support byte-level progress reporting (downloaded,
  /// total); specs that can't (e.g. opaque bundle extractors) may ignore it.
  async fn install(
    &self,
    http: &reqwest::Client,
    release: &ReleaseInfo,
    bin_dir: &Path,
    on_progress: &ProgressFn,
  ) -> anyhow::Result<()>;
}

pub struct BinManager {
  bin_dir: PathBuf,
  http: reqwest::Client,
  app: AppHandle,
  specs: Vec<Arc<dyn BinarySpec>>,
  cache: RwLock<HashMap<&'static str, ResolvedBinary>>,
  init_lock: Mutex<()>,
}

impl BinManager {
  pub fn new(bin_dir: PathBuf, app: AppHandle, specs: Vec<Arc<dyn BinarySpec>>) -> Self {
    let http = reqwest::Client::builder()
      .user_agent(concat!("purr/", env!("CARGO_PKG_VERSION")))
      .timeout(Duration::from_secs(60))
      .build()
      .expect("build reqwest client");
    Self {
      bin_dir,
      http,
      app,
      specs,
      cache: RwLock::new(HashMap::new()),
      init_lock: Mutex::new(()),
    }
  }

  pub fn bin_dir(&self) -> &Path {
    &self.bin_dir
  }

  pub fn http(&self) -> &reqwest::Client {
    &self.http
  }

  /// First-run resolve + install for every registered spec. Idempotent and
  /// safe to call concurrently from setup and from commands — only one caller
  /// performs the actual install work, the rest wait on `init_lock` and then
  /// see the populated cache.
  pub async fn ensure_all(&self) -> anyhow::Result<()> {
    if self.all_cached().await {
      return Ok(());
    }

    let _guard = self.init_lock.lock().await;
    if self.all_cached().await {
      return Ok(());
    }

    tokio::fs::create_dir_all(&self.bin_dir).await?;
    let mut meta = metadata::load(&self.bin_dir).await.unwrap_or_default();

    for spec in self.specs.clone() {
      if self.cache.read().await.contains_key(spec.id()) {
        continue;
      }
      let resolved = self.resolve_spec(spec.as_ref(), &mut meta).await?;
      let id = spec.id();
      eprintln!(
        "[bin_manager] resolved {} ({:?}) -> {:?}",
        id, resolved.source, resolved.executables
      );
      self.cache.write().await.insert(id, resolved);
    }

    metadata::save(&self.bin_dir, &meta).await?;
    Ok(())
  }

  async fn all_cached(&self) -> bool {
    let cache = self.cache.read().await;
    self.specs.iter().all(|s| cache.contains_key(s.id()))
  }

  async fn resolve_spec(
    &self,
    spec: &dyn BinarySpec,
    meta: &mut metadata::VersionMap,
  ) -> anyhow::Result<ResolvedBinary> {
    if let Some(r) = self.try_managed(spec) {
      return Ok(r);
    }
    if spec.probe_path() {
      if let Some(r) = self.try_path(spec) {
        return Ok(r);
      }
    }

    eprintln!("[bin_manager] installing {}", spec.id());
    let release = spec.fetch_latest(&self.http).await?;
    let title = format!("Installing {}", spec.id());
    self
      .install_with_notifications(spec, &release, title)
      .await?;

    meta.insert(
      spec.id().to_string(),
      metadata::VersionEntry {
        version: release.version.clone(),
        installed_at: metadata::now(),
        sha256: None,
      },
    );
    self
      .try_managed(spec)
      .ok_or_else(|| anyhow::anyhow!("{}: install completed but expected files are missing", spec.id()))
  }

  /// Wrap `spec.install` with a notification lifecycle: upsert a progress
  /// notification at start, forward throttled byte-level progress, transition
  /// to `success` / `error` on completion.
  async fn install_with_notifications(
    &self,
    spec: &dyn BinarySpec,
    release: &ReleaseInfo,
    title: String,
  ) -> anyhow::Result<()> {
    let notif_id = notification_id(spec.id());
    notify::upsert(
      &self.app,
      Notification {
        id: notif_id.clone(),
        kind: NotificationType::Progress,
        title,
        desc: Some(format!("v{}", release.version)),
        progress: None,
        last_updated: 0,
      },
    );

    let app = self.app.clone();
    let notif_id_cb = notif_id.clone();
    let last_emit: Arc<StdMutex<Option<Instant>>> = Arc::new(StdMutex::new(None));
    let on_progress: Box<ProgressFn> = Box::new(move |downloaded, total| {
      let Some(total) = total else {
        return;
      };
      if total == 0 {
        return;
      }
      {
        let mut last = last_emit.lock().unwrap();
        let now = Instant::now();
        let should_emit = match *last {
          Some(t) if now.duration_since(t) < PROGRESS_THROTTLE && downloaded < total => false,
          _ => true,
        };
        if !should_emit {
          return;
        }
        *last = Some(now);
      }
      let pct = (downloaded as f32 / total as f32).clamp(0.0, 1.0);
      notify::update_progress(&app, &notif_id_cb, pct);
    });

    match spec.install(&self.http, release, &self.bin_dir, on_progress.as_ref()).await {
      Ok(()) => {
        notify::succeed(
          &self.app,
          &notif_id,
          Some(format!("{} v{}", spec.id(), release.version)),
        );
        Ok(())
      }
      Err(e) => {
        notify::fail(&self.app, &notif_id, e.to_string());
        Err(e)
      }
    }
  }

  fn try_managed(&self, spec: &dyn BinarySpec) -> Option<ResolvedBinary> {
    let mut executables = HashMap::new();
    for name in spec.provides() {
      let p = self.bin_dir.join(executable_name(name));
      if !p.is_file() {
        return None;
      }
      executables.insert(*name, p);
    }
    Some(ResolvedBinary {
      source: BinarySource::Managed,
      executables,
    })
  }

  fn try_path(&self, spec: &dyn BinarySpec) -> Option<ResolvedBinary> {
    let mut executables = HashMap::new();
    for name in spec.provides() {
      let p = path_probe::find(name)?;
      executables.insert(*name, p);
    }
    Some(ResolvedBinary {
      source: BinarySource::SystemPath,
      executables,
    })
  }

  pub async fn resolve(&self, id: &'static str) -> anyhow::Result<ResolvedBinary> {
    let cache = self.cache.read().await;
    cache
      .get(id)
      .cloned()
      .ok_or_else(|| anyhow::anyhow!("binary {} not resolved (was ensure_all called?)", id))
  }

  pub async fn exe(&self, id: &'static str, name: &'static str) -> anyhow::Result<PathBuf> {
    let r = self.resolve(id).await?;
    r.executables
      .get(name)
      .cloned()
      .ok_or_else(|| anyhow::anyhow!("binary {} has no executable named {}", id, name))
  }

  pub async fn dir(&self, id: &'static str) -> anyhow::Result<PathBuf> {
    let r = self.resolve(id).await?;
    r.dir()
      .map(PathBuf::from)
      .ok_or_else(|| anyhow::anyhow!("binary {} has no resolved directory", id))
  }

  /// Spawns one tokio task per spec with `auto_update() == true`. Non-blocking;
  /// failures are logged and swallowed so the app never fails to start because
  /// GitHub is unreachable.
  pub fn spawn_background_updates(self: Arc<Self>) {
    for spec in self.specs.clone() {
      if !spec.auto_update() {
        continue;
      }
      let this = self.clone();
      tokio::spawn(async move {
        if let Err(e) = this.run_update(spec.as_ref()).await {
          eprintln!("[bin_manager] update failed for {}: {e:#}", spec.id());
        }
      });
    }
  }

  async fn run_update(&self, spec: &dyn BinarySpec) -> anyhow::Result<()> {
    // Serialize against ensure_all so we never race on the metadata file or
    // on an install-in-progress.
    let _guard = self.init_lock.lock().await;

    let current_version = metadata::load(&self.bin_dir)
      .await
      .unwrap_or_default()
      .get(spec.id())
      .map(|e| e.version.clone());

    let release = match spec.fetch_latest(&self.http).await {
      Ok(r) => r,
      Err(e) => {
        eprintln!("[bin_manager] {} fetch_latest failed: {e:#}", spec.id());
        return Ok(());
      }
    };

    if let Some(cur) = &current_version {
      if cur == &release.version {
        eprintln!("[bin_manager] {} already at {cur}", spec.id());
        return Ok(());
      }
    }

    eprintln!(
      "[bin_manager] updating {} from {:?} -> {}",
      spec.id(),
      current_version,
      release.version
    );

    let title = format!("Updating {}", spec.id());
    self
      .install_with_notifications(spec, &release, title)
      .await?;

    let mut meta = metadata::load(&self.bin_dir).await.unwrap_or_default();
    meta.insert(
      spec.id().to_string(),
      metadata::VersionEntry {
        version: release.version.clone(),
        installed_at: metadata::now(),
        sha256: None,
      },
    );
    metadata::save(&self.bin_dir, &meta).await?;

    if let Some(resolved) = self.try_managed(spec) {
      self.cache.write().await.insert(spec.id(), resolved);
    }

    Ok(())
  }
}

pub fn executable_name(base: &str) -> String {
  if cfg!(windows) {
    format!("{base}.exe")
  } else {
    base.to_string()
  }
}

fn notification_id(spec_id: &str) -> String {
  format!("bin-install-{spec_id}")
}
