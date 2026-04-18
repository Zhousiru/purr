use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use std::time::Duration;

use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

use crate::event_name;
use crate::notify::{self, Notification, NotificationType};

use super::install;
use super::metadata::{self, VersionEntry, VersionMap};
use super::path_probe;
use super::spec::{executable_name, BinarySource, BinarySpec, ResolvedBinary};
use super::status::{BinaryRecord, BinaryStatus, BinaryStatusEvent, InstallPhase};

fn check_note_id(id: &str) -> String {
  format!("bin-check-{id}")
}

/// Hard cap on the GitHub-API roundtrip used by the background update check.
/// Distinct from the reqwest client's overall 60s ceiling — this is tight
/// specifically so the frontend readiness gate flips quickly when offline.
const FETCH_LATEST_TIMEOUT: Duration = Duration::from_secs(10);

pub struct BinManager {
  bin_dir: PathBuf,
  http: reqwest::Client,
  app: AppHandle,
  specs: Vec<Arc<dyn BinarySpec>>,
  records: RwLock<HashMap<&'static str, BinaryRecord>>,
  init_lock: Mutex<()>,
}

impl BinManager {
  pub fn new(bin_dir: PathBuf, app: AppHandle, specs: Vec<Arc<dyn BinarySpec>>) -> Self {
    let http = reqwest::Client::builder()
      .user_agent(concat!("purr/", env!("CARGO_PKG_VERSION")))
      .timeout(Duration::from_secs(60))
      .build()
      .expect("build reqwest client");
    let records = specs
      .iter()
      .map(|s| (s.id(), BinaryRecord::new(BinaryStatus::NotInstalled)))
      .collect::<HashMap<_, _>>();
    Self {
      bin_dir,
      http,
      app,
      specs,
      records: RwLock::new(records),
      init_lock: Mutex::new(()),
    }
  }

  pub fn bin_dir(&self) -> &Path {
    &self.bin_dir
  }

  pub fn http(&self) -> &reqwest::Client {
    &self.http
  }

  pub fn app(&self) -> &AppHandle {
    &self.app
  }

  // ---- Public readiness API ----

  /// Snapshot of every registered binary's current status. Used by
  /// `get_binary_statuses` for the initial frontend load.
  pub fn snapshot_statuses(&self) -> HashMap<String, BinaryStatus> {
    let records = self.records.read().unwrap();
    records
      .iter()
      .map(|(k, v)| ((*k).to_string(), v.status.clone()))
      .collect()
  }

  /// Update the status field and emit a `BINARY_STATUS` event. Does not
  /// touch `resolved`. Safe to call from sync closures (progress callback).
  pub(super) fn set_status(&self, id: &'static str, status: BinaryStatus) {
    {
      let mut records = self.records.write().unwrap();
      let rec = records
        .entry(id)
        .or_insert_with(|| BinaryRecord::new(BinaryStatus::NotInstalled));
      rec.status = status.clone();
    }
    let _ = self.app.emit(
      event_name::BINARY_STATUS,
      BinaryStatusEvent {
        id: id.to_string(),
        status,
      },
    );
  }

  /// Atomically update status + resolved. Invariant: callers writing
  /// `BinaryStatus::Ready` must supply `Some(resolved)`.
  pub(super) fn set_record(
    &self,
    id: &'static str,
    status: BinaryStatus,
    resolved: Option<ResolvedBinary>,
  ) {
    {
      let mut records = self.records.write().unwrap();
      let rec = records
        .entry(id)
        .or_insert_with(|| BinaryRecord::new(BinaryStatus::NotInstalled));
      rec.status = status.clone();
      if let Some(r) = resolved {
        rec.resolved = Some(r);
      }
    }
    let _ = self.app.emit(
      event_name::BINARY_STATUS,
      BinaryStatusEvent {
        id: id.to_string(),
        status,
      },
    );
  }

  // ---- ensure_all ----

  /// First-run resolve + install for every registered spec. Idempotent and
  /// safe to call concurrently from setup and from commands — only one
  /// caller performs the actual install work, the rest wait on `init_lock`
  /// and then see the populated records.
  pub async fn ensure_all(&self) -> anyhow::Result<()> {
    if self.all_resolved() {
      return Ok(());
    }

    let _guard = self.init_lock.lock().await;
    if self.all_resolved() {
      return Ok(());
    }

    tokio::fs::create_dir_all(&self.bin_dir).await?;
    let mut meta = metadata::load(&self.bin_dir).await.unwrap_or_default();
    self.seed_initial_records(&meta);

    for spec in self.specs.clone() {
      if self
        .records
        .read()
        .unwrap()
        .get(spec.id())
        .is_some_and(|r| r.resolved.is_some())
      {
        continue;
      }
      self.resolve_or_install(spec.as_ref(), &mut meta).await?;
    }

    metadata::save(&self.bin_dir, &meta).await?;
    Ok(())
  }

  fn all_resolved(&self) -> bool {
    let records = self.records.read().unwrap();
    self
      .specs
      .iter()
      .all(|s| records.get(s.id()).is_some_and(|r| r.resolved.is_some()))
  }

  /// Seed records from existing on-disk state so the frontend sees a
  /// meaningful snapshot immediately on launch. For each spec:
  ///
  /// - Managed copy exists → `Installed{version}` (auto-update) or
  ///   `Ready{version, Managed}` (else)
  /// - `$PATH` fallback applies and matches → `Ready{"system", SystemPath}`
  /// - Nothing on disk → leave as `NotInstalled`
  ///
  /// Emits one event per resolved spec so the frontend populates without a
  /// round-trip.
  fn seed_initial_records(&self, meta: &VersionMap) {
    for spec in self.specs.clone() {
      let id = spec.id();
      // Skip specs already past `NotInstalled`: avoid clobbering an
      // install-in-progress from a concurrent ensure_all call.
      {
        let records = self.records.read().unwrap();
        if let Some(rec) = records.get(id) {
          if !matches!(rec.status, BinaryStatus::NotInstalled) || rec.resolved.is_some() {
            continue;
          }
        }
      }

      if let Some(resolved) = self.try_managed(spec.as_ref()) {
        let version = meta
          .get(id)
          .map(|e| e.version.clone())
          .unwrap_or_else(|| "unknown".into());
        let status = if spec.auto_update() {
          BinaryStatus::Installed { version }
        } else {
          BinaryStatus::Ready {
            version,
            source: BinarySource::Managed,
          }
        };
        self.set_record(id, status, Some(resolved));
      } else if spec.probe_path() {
        if let Some(resolved) = self.try_path(spec.as_ref()) {
          self.set_record(
            id,
            BinaryStatus::Ready {
              version: "system".into(),
              source: BinarySource::SystemPath,
            },
            Some(resolved),
          );
        }
      }
    }
  }

  async fn resolve_or_install(
    &self,
    spec: &dyn BinarySpec,
    meta: &mut VersionMap,
  ) -> anyhow::Result<ResolvedBinary> {
    // Fast path: already resolved by seeding or a prior iteration.
    if let Some(r) = self
      .records
      .read()
      .unwrap()
      .get(spec.id())
      .and_then(|rec| rec.resolved.clone())
    {
      eprintln!(
        "[bin_manager] {} already resolved ({:?})",
        spec.id(),
        r.source
      );
      return Ok(r);
    }

    eprintln!("[bin_manager] installing {}", spec.id());
    let release = spec.fetch_latest(&self.http).await?;
    let resolved = install::perform_install(self, spec, InstallPhase::First, &release).await?;

    meta.insert(
      spec.id().to_string(),
      VersionEntry {
        version: release.version,
        installed_at: metadata::now(),
        sha256: None,
      },
    );

    Ok(resolved)
  }

  // ---- File probing ----

  pub(super) fn try_managed(&self, spec: &dyn BinarySpec) -> Option<ResolvedBinary> {
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

  pub(super) fn try_path(&self, spec: &dyn BinarySpec) -> Option<ResolvedBinary> {
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

  // ---- Resolve lookups (sync, for consumers) ----

  pub fn resolve(&self, id: &'static str) -> anyhow::Result<ResolvedBinary> {
    let records = self.records.read().unwrap();
    records
      .get(id)
      .and_then(|r| r.resolved.clone())
      .ok_or_else(|| anyhow::anyhow!("binary {} not resolved (was ensure_all called?)", id))
  }

  pub fn exe(&self, id: &'static str, name: &'static str) -> anyhow::Result<PathBuf> {
    let r = self.resolve(id)?;
    r.executables
      .get(name)
      .cloned()
      .ok_or_else(|| anyhow::anyhow!("binary {} has no executable named {}", id, name))
  }

  pub fn dir(&self, id: &'static str) -> anyhow::Result<PathBuf> {
    let r = self.resolve(id)?;
    r.dir()
      .map(PathBuf::from)
      .ok_or_else(|| anyhow::anyhow!("binary {} has no resolved directory", id))
  }

  // ---- Background updates ----

  /// Spawns one tokio task per spec with `auto_update() == true`. Non-
  /// blocking; failures are logged and swallowed so the app never fails to
  /// start because GitHub is unreachable.
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
    // Serialize against ensure_all so we never race on metadata or
    // concurrent install.
    let _guard = self.init_lock.lock().await;

    let current_version = metadata::load(&self.bin_dir)
      .await
      .unwrap_or_default()
      .get(spec.id())
      .map(|e| e.version.clone());

    let Some(cur) = current_version else {
      // Nothing to update. ensure_all should already have set Failed or
      // NotInstalled; leave that state alone.
      return Ok(());
    };

    self.set_status(
      spec.id(),
      BinaryStatus::CheckingUpdate {
        version: cur.clone(),
      },
    );

    let label = spec.display_name();
    let note_id = check_note_id(spec.id());
    notify::upsert(
      &self.app,
      Notification::new(
        &note_id,
        NotificationType::Progress,
        format!("Checking {label} for updates"),
      )
      .with_desc(format!("Currently at {cur}"))
      .silent(),
    );

    let fetch = tokio::time::timeout(FETCH_LATEST_TIMEOUT, spec.fetch_latest(&self.http)).await;
    let release = match fetch {
      Ok(Ok(r)) => r,
      Ok(Err(e)) => {
        eprintln!("[bin_manager] {} update check failed: {e:#}", spec.id());
        notify::upsert(
          &self.app,
          Notification::new(
            &note_id,
            NotificationType::Error,
            format!("{label} update check failed"),
          )
          .with_desc(format!("{e}"))
          .silent(),
        );
        self.mark_ready_fallback(spec, cur);
        return Ok(());
      }
      Err(_elapsed) => {
        eprintln!(
          "[bin_manager] {} update check timed out after {:?}",
          spec.id(),
          FETCH_LATEST_TIMEOUT
        );
        notify::upsert(
          &self.app,
          Notification::new(
            &note_id,
            NotificationType::Error,
            format!("{label} update check timed out"),
          )
          .with_desc(format!("After {:?}", FETCH_LATEST_TIMEOUT))
          .silent(),
        );
        self.mark_ready_fallback(spec, cur);
        return Ok(());
      }
    };

    if cur == release.version {
      eprintln!("[bin_manager] {} already at {cur}", spec.id());
      notify::upsert(
        &self.app,
        Notification::new(
          &note_id,
          NotificationType::Info,
          format!("{label} is up to date"),
        )
        .with_desc(format!("No updates available, current: {cur}"))
        .silent(),
      );
      self.mark_ready_fallback(spec, cur);
      return Ok(());
    }

    // An update is available — drop the silent "checking" entry; the install
    // flow surfaces its own (non-silent) progress notification.
    notify::remove(&self.app, &note_id);

    eprintln!(
      "[bin_manager] updating {} from {cur} -> {}",
      spec.id(),
      release.version
    );

    let phase = InstallPhase::Update {
      from_version: cur.clone(),
    };
    match install::perform_install(self, spec, phase, &release).await {
      Ok(_) => {
        let mut meta = metadata::load(&self.bin_dir).await.unwrap_or_default();
        meta.insert(
          spec.id().to_string(),
          VersionEntry {
            version: release.version,
            installed_at: metadata::now(),
            sha256: None,
          },
        );
        metadata::save(&self.bin_dir, &meta).await?;
      }
      Err(e) => {
        // perform_install already transitioned the status to Failed. Since
        // the old binary is still on disk, override back to Ready{old} so
        // the app stays usable. The notification toast surfaces the error.
        eprintln!("[bin_manager] {} update install failed: {e:#}", spec.id());
        self.mark_ready_fallback(spec, cur);
      }
    }

    Ok(())
  }

  /// Transition the spec to `Ready{version, Managed}` assuming files are on
  /// disk. No-op if `try_managed` returns None (shouldn't happen on this
  /// path but we tolerate it for robustness).
  fn mark_ready_fallback(&self, spec: &dyn BinarySpec, version: String) {
    if let Some(resolved) = self.try_managed(spec) {
      self.set_record(
        spec.id(),
        BinaryStatus::Ready {
          version,
          source: BinarySource::Managed,
        },
        Some(resolved),
      );
    }
  }

  // ---- Retry ----

  /// User-triggered retry from a `Failed` state. Returns immediately; the
  /// actual install runs on a spawned task and progress flows through the
  /// existing status + notification events.
  pub fn retry(self: &Arc<Self>, id: &str) -> anyhow::Result<()> {
    {
      let records = self.records.read().unwrap();
      let Some(rec) = records.get(id) else {
        anyhow::bail!("unknown binary {id}");
      };
      if !matches!(rec.status, BinaryStatus::Failed { .. }) {
        return Ok(());
      }
    }

    let spec = self
      .specs
      .iter()
      .find(|s| s.id() == id)
      .cloned()
      .ok_or_else(|| anyhow::anyhow!("unknown binary {id}"))?;

    let this = self.clone();
    tokio::spawn(async move {
      {
        let _guard = this.init_lock.lock().await;
        let mut meta = metadata::load(&this.bin_dir).await.unwrap_or_default();
        if let Err(e) = this.resolve_or_install(spec.as_ref(), &mut meta).await {
          eprintln!("[bin_manager] retry {} failed: {e:#}", spec.id());
          return;
        }
        if let Err(e) = metadata::save(&this.bin_dir, &meta).await {
          eprintln!("[bin_manager] retry {} save failed: {e:#}", spec.id());
        }
      }
      if spec.auto_update() {
        if let Err(e) = this.run_update(spec.as_ref()).await {
          eprintln!(
            "[bin_manager] retry {} post-update check failed: {e:#}",
            spec.id()
          );
        }
      }
    });

    Ok(())
  }
}
