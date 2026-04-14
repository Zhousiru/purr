#![allow(dead_code)]

use std::path::{Path, PathBuf};

use async_trait::async_trait;

use crate::bin_manager::{
  download, BinarySpec, ProgressFn, ReleaseAsset, ReleaseInfo,
};

/// Downloads and manages ffmpeg + ffprobe as a single managed install. We
/// mirror the same upstream sources ffmpeg-sidecar uses (gyan.dev / johnvan
/// sickle / evermeet) but drive the download ourselves so byte-level progress
/// reports land in the notification system.
pub struct FfmpegSpec;

#[async_trait]
impl BinarySpec for FfmpegSpec {
  fn id(&self) -> &'static str {
    "ffmpeg"
  }

  fn provides(&self) -> &'static [&'static str] {
    &["ffmpeg", "ffprobe"]
  }

  fn probe_path(&self) -> bool {
    true
  }

  fn auto_update(&self) -> bool {
    false
  }

  async fn fetch_latest(&self, _http: &reqwest::Client) -> anyhow::Result<ReleaseInfo> {
    // ffmpeg doesn't auto-update so the version string is display-only. We
    // skip a real version query — none of the upstreams expose a stable
    // machine-readable endpoint, and "latest" is accurate.
    let assets = platform_assets()
      .into_iter()
      .map(|(name, url)| ReleaseAsset { name, url })
      .collect();
    Ok(ReleaseInfo {
      version: "latest".into(),
      assets,
      checksums: None,
    })
  }

  async fn install(
    &self,
    http: &reqwest::Client,
    release: &ReleaseInfo,
    bin_dir: &Path,
    on_progress: &ProgressFn,
  ) -> anyhow::Result<()> {
    if release.assets.is_empty() {
      anyhow::bail!(
        "no ffmpeg asset URLs for target_os={} target_arch={}",
        std::env::consts::OS,
        std::env::consts::ARCH
      );
    }

    let tmp_dir = bin_dir.join(".tmp");
    tokio::fs::create_dir_all(&tmp_dir).await?;

    for (idx, asset) in release.assets.iter().enumerate() {
      let archive_name = format!("ffmpeg-asset-{idx}.bin");
      let tmp = tmp_dir.join(&archive_name);
      download::download_to_file(http, &asset.url, &tmp, |d, t| on_progress(d, t)).await?;
      extract_asset(&tmp, bin_dir).await?;
      let _ = tokio::fs::remove_file(&tmp).await;
    }

    set_executable_bits(bin_dir).await?;
    let _ = tokio::fs::remove_dir_all(&tmp_dir).await;

    // Sanity check — if we couldn't locate ffmpeg or ffprobe after extract,
    // bail with a useful error so the manager surfaces it via notify::fail.
    for name in ["ffmpeg", "ffprobe"] {
      let p = bin_dir.join(executable_name(name));
      if !tokio::fs::try_exists(&p).await.unwrap_or(false) {
        anyhow::bail!("ffmpeg install completed but {} is missing", name);
      }
    }

    Ok(())
  }
}

fn executable_name(base: &str) -> String {
  crate::bin_manager::executable_name(base)
}

/// Pick the right asset URL(s) for the current target triple. The `name` in
/// the returned tuple is a display label (shown in logs/notifications), not
/// a filename. Multi-asset platforms (macOS) download two archives.
///
/// Windows + Linux use BtbN/FFmpeg-Builds GitHub releases (fastly CDN, fast
/// worldwide) since gyan.dev/johnvansickle are single-origin and slow from
/// most of the world. macOS stays on evermeet because BtbN doesn't build
/// for macOS.
fn platform_assets() -> Vec<(String, String)> {
  #[cfg(target_os = "windows")]
  {
    vec![(
      "BtbN/ffmpeg-master-latest-win64-gpl".into(),
      "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip".into(),
    )]
  }

  #[cfg(target_os = "linux")]
  {
    let slug = if cfg!(target_arch = "aarch64") {
      "linuxarm64"
    } else {
      "linux64"
    };
    vec![(
      format!("BtbN/ffmpeg-master-latest-{slug}-gpl"),
      format!(
        "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-{slug}-gpl.tar.xz"
      ),
    )]
  }

  #[cfg(target_os = "macos")]
  {
    vec![
      (
        "evermeet/ffmpeg".into(),
        "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip".into(),
      ),
      (
        "evermeet/ffprobe".into(),
        "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip".into(),
      ),
    ]
  }

  #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
  {
    Vec::new()
  }
}

#[cfg(target_os = "windows")]
async fn extract_asset(archive: &Path, bin_dir: &Path) -> anyhow::Result<()> {
  let archive = archive.to_path_buf();
  let bin_dir = bin_dir.to_path_buf();
  tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
    extract_zip_flat(&archive, &bin_dir, &["ffmpeg.exe", "ffprobe.exe"])
  })
  .await
  .map_err(|e| anyhow::anyhow!("ffmpeg extract join error: {e}"))??;
  Ok(())
}

#[cfg(target_os = "linux")]
async fn extract_asset(archive: &Path, bin_dir: &Path) -> anyhow::Result<()> {
  let archive = archive.to_path_buf();
  let bin_dir = bin_dir.to_path_buf();
  tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
    let file = std::fs::File::open(&archive)?;
    let xz = xz2::read::XzDecoder::new(file);
    let mut tar = tar::Archive::new(xz);
    for entry in tar.entries()? {
      let mut entry = entry?;
      let path = entry.path()?.to_path_buf();
      let Some(file_name) = path.file_name().and_then(|s| s.to_str()) else {
        continue;
      };
      if file_name == "ffmpeg" || file_name == "ffprobe" {
        let dest = bin_dir.join(file_name);
        if dest.exists() {
          let _ = std::fs::remove_file(&dest);
        }
        entry.unpack(&dest)?;
      }
    }
    Ok(())
  })
  .await
  .map_err(|e| anyhow::anyhow!("ffmpeg extract join error: {e}"))??;
  Ok(())
}

#[cfg(target_os = "macos")]
async fn extract_asset(archive: &Path, bin_dir: &Path) -> anyhow::Result<()> {
  let archive = archive.to_path_buf();
  let bin_dir = bin_dir.to_path_buf();
  tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
    extract_zip_flat(&archive, &bin_dir, &["ffmpeg", "ffprobe"])
  })
  .await
  .map_err(|e| anyhow::anyhow!("ffmpeg extract join error: {e}"))??;
  Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
async fn extract_asset(_archive: &Path, _bin_dir: &Path) -> anyhow::Result<()> {
  anyhow::bail!("unsupported platform for ffmpeg install")
}

/// Walk the zip, match entries by exact file name, write them flat into
/// `bin_dir`. Used by Windows (gyan.dev bundle; binaries live in `bin/`) and
/// macOS (evermeet zips; single binary at the root).
#[cfg(any(target_os = "windows", target_os = "macos"))]
fn extract_zip_flat(
  archive: &Path,
  bin_dir: &Path,
  wanted: &[&'static str],
) -> anyhow::Result<()> {
  let file = std::fs::File::open(archive)?;
  let mut zip = zip::ZipArchive::new(file)?;
  let mut found: Vec<&'static str> = Vec::new();

  for i in 0..zip.len() {
    let mut entry = zip.by_index(i)?;
    if entry.is_dir() {
      continue;
    }
    let Some(name) = entry.enclosed_name() else {
      continue;
    };
    let Some(file_name) = name.file_name().and_then(|s| s.to_str()) else {
      continue;
    };
    let Some(matched) = wanted.iter().find(|w| **w == file_name).copied() else {
      continue;
    };
    let dest: PathBuf = bin_dir.join(matched);
    if dest.exists() {
      let _ = std::fs::remove_file(&dest);
    }
    let mut out = std::fs::File::create(&dest)?;
    std::io::copy(&mut entry, &mut out)?;
    found.push(matched);
  }

  for w in wanted {
    if !found.iter().any(|f| f == w) {
      anyhow::bail!("archive missing expected entry: {w}");
    }
  }
  Ok(())
}

#[cfg(unix)]
async fn set_executable_bits(bin_dir: &Path) -> anyhow::Result<()> {
  use std::os::unix::fs::PermissionsExt;
  for name in ["ffmpeg", "ffprobe"] {
    let p = bin_dir.join(name);
    if tokio::fs::try_exists(&p).await.unwrap_or(false) {
      let mut perms = tokio::fs::metadata(&p).await?.permissions();
      perms.set_mode(0o755);
      tokio::fs::set_permissions(&p, perms).await?;
    }
  }
  Ok(())
}

#[cfg(not(unix))]
async fn set_executable_bits(_bin_dir: &Path) -> anyhow::Result<()> {
  Ok(())
}
