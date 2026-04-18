use std::time::Duration;

use crate::notify::{self, Notification, NotificationType};

use super::manager::BinManager;
use super::progress::ProgressThrottle;
use super::spec::{BinarySource, BinarySpec, ReleaseInfo, ResolvedBinary};
use super::status::{BinaryStatus, InstallPhase};

/// Minimum gap between notification + status progress updates. yt-dlp
/// delivers ~8 KiB chunks; without throttling the event channel spams at
/// tens of emits/sec.
const PROGRESS_THROTTLE: Duration = Duration::from_millis(200);

fn install_note_id(spec_id: &str) -> String {
  format!("bin-install-{spec_id}")
}

/// Single source of truth for the install lifecycle. Handles:
///   - opening / transitioning the notification toast
///   - emitting `Installing` / `Updating` status with throttled progress
///   - verifying files landed on disk
///   - emitting `Ready` + populating `BinaryRecord.resolved` on success
///   - emitting `Failed` on error
///
/// Both fresh-install (`ensure_all`) and background-update (`run_update`)
/// paths funnel through this function. Callers are responsible for
/// persisting `version.json` after success.
pub async fn perform_install(
  manager: &BinManager,
  spec: &dyn BinarySpec,
  phase: InstallPhase,
  release: &ReleaseInfo,
) -> anyhow::Result<ResolvedBinary> {
  let spec_id = spec.id();
  let label = spec.display_name();
  let notif_id = install_note_id(spec_id);
  let title = match &phase {
    InstallPhase::First => format!("Installing {label}"),
    InstallPhase::Update { .. } => format!("Updating {label}"),
  };

  notify::upsert(
    manager.app(),
    Notification::new(&notif_id, NotificationType::Progress, title)
      .with_desc(format!("v{}", release.version)),
  );

  let initial_status = match &phase {
    InstallPhase::First => BinaryStatus::Installing { progress: None },
    InstallPhase::Update { from_version } => BinaryStatus::Updating {
      version_from: from_version.clone(),
      progress: None,
    },
  };
  manager.set_status(spec_id, initial_status);

  let throttle = ProgressThrottle::new(PROGRESS_THROTTLE);
  let on_progress = |downloaded: u64, total: Option<u64>| {
    let Some(total) = total else {
      return;
    };
    if total == 0 {
      return;
    }
    if !throttle.should_emit(downloaded, total) {
      return;
    }
    let pct = (downloaded as f32 / total as f32).clamp(0.0, 1.0);
    notify::update_progress(manager.app(), &notif_id, pct);
    let status = match &phase {
      InstallPhase::First => BinaryStatus::Installing {
        progress: Some(pct),
      },
      InstallPhase::Update { from_version } => BinaryStatus::Updating {
        version_from: from_version.clone(),
        progress: Some(pct),
      },
    };
    manager.set_status(spec_id, status);
  };

  let install_result = spec
    .install(manager.http(), release, manager.bin_dir(), &on_progress)
    .await;

  match install_result {
    Ok(()) => {
      let resolved = manager.try_managed(spec).ok_or_else(|| {
        anyhow::anyhow!(
          "{}: install completed but expected files are missing",
          spec_id
        )
      })?;
      notify::succeed(
        manager.app(),
        &notif_id,
        Some(format!("{label} v{}", release.version)),
      );
      manager.set_record(
        spec_id,
        BinaryStatus::Ready {
          version: release.version.clone(),
          source: BinarySource::Managed,
        },
        Some(resolved.clone()),
      );
      Ok(resolved)
    }
    Err(e) => {
      let msg = e.to_string();
      notify::fail(manager.app(), &notif_id, msg.clone());
      manager.set_status(
        spec_id,
        BinaryStatus::Failed {
          error: msg,
          retryable: true,
        },
      );
      Err(e)
    }
  }
}
