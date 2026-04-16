#![allow(dead_code)]

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use async_trait::async_trait;
use serde::Deserialize;

use crate::bin_manager::{
  download, executable_name, BinarySpec, ProgressFn, ReleaseAsset, ReleaseInfo,
};

const GITHUB_LATEST: &str = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";

pub struct YtDlpSpec;

#[async_trait]
impl BinarySpec for YtDlpSpec {
  fn id(&self) -> &'static str {
    "yt-dlp"
  }

  fn provides(&self) -> &'static [&'static str] {
    &["yt-dlp"]
  }

  fn probe_path(&self) -> bool {
    false
  }

  fn auto_update(&self) -> bool {
    true
  }

  async fn fetch_latest(&self, http: &reqwest::Client) -> anyhow::Result<ReleaseInfo> {
    let rel: GithubRelease = http
      .get(GITHUB_LATEST)
      .send()
      .await?
      .error_for_status()?
      .json()
      .await?;

    let assets = rel
      .assets
      .into_iter()
      .map(|a| ReleaseAsset {
        name: a.name,
        url: a.browser_download_url,
      })
      .collect();

    Ok(ReleaseInfo {
      version: rel.tag_name,
      assets,
    })
  }

  async fn install(
    &self,
    http: &reqwest::Client,
    release: &ReleaseInfo,
    bin_dir: &Path,
    on_progress: &ProgressFn<'_>,
  ) -> anyhow::Result<()> {
    let asset_name = platform_asset_name();
    let asset = release
      .assets
      .iter()
      .find(|a| a.name == asset_name)
      .ok_or_else(|| {
        anyhow::anyhow!(
          "yt-dlp release {} has no asset named {asset_name}",
          release.version
        )
      })?;

    let dest = bin_dir.join(executable_name("yt-dlp"));
    let tmp_dir = bin_dir.join(".tmp");
    tokio::fs::create_dir_all(&tmp_dir).await?;
    let tmp = tmp_dir.join(format!("yt-dlp-{}.part", release.version));

    let outcome = download::download_to_file(http, &asset.url, &tmp, |d, t| {
      on_progress(d, t);
    })
    .await?;
    eprintln!(
      "[bin_manager] downloaded yt-dlp {} ({} bytes)",
      release.version, outcome.bytes
    );

    // Verify SHA256 against the release's SHA2-256SUMS asset if present. If
    // the asset is missing we log and continue — upstream occasionally ships
    // releases without sums during an outage.
    if let Some(sums_asset) = release.assets.iter().find(|a| a.name == "SHA2-256SUMS") {
      let sums_text = download::fetch_text(http, &sums_asset.url).await?;
      if let Some(expected) = parse_sha_sums(&sums_text).get(asset_name) {
        if !expected.eq_ignore_ascii_case(&outcome.sha256_hex) {
          let _ = tokio::fs::remove_file(&tmp).await;
          anyhow::bail!(
            "yt-dlp sha256 mismatch for {asset_name}: expected {expected}, got {}",
            outcome.sha256_hex
          );
        }
        eprintln!("[bin_manager] verified yt-dlp sha256 {}", outcome.sha256_hex);
      } else {
        eprintln!(
          "[bin_manager] SHA2-256SUMS has no entry for {asset_name}, skipping verification"
        );
      }
    } else {
      eprintln!("[bin_manager] release has no SHA2-256SUMS, skipping verification");
    }

    // Atomic swap that tolerates the current binary being open for execution
    // on Windows: move current to <name>.old first, rename new into place,
    // then best-effort remove .old (ignore sharing violation — a later
    // launch will reap it).
    let old_path = {
      let mut s = dest.clone().into_os_string();
      s.push(".old");
      PathBuf::from(s)
    };
    let _ = tokio::fs::remove_file(&old_path).await;
    if tokio::fs::try_exists(&dest).await.unwrap_or(false) {
      tokio::fs::rename(&dest, &old_path).await?;
    }
    tokio::fs::rename(&tmp, &dest).await?;
    let _ = tokio::fs::remove_file(&old_path).await;

    #[cfg(unix)]
    {
      use std::os::unix::fs::PermissionsExt;
      let mut perms = tokio::fs::metadata(&dest).await?.permissions();
      perms.set_mode(0o755);
      tokio::fs::set_permissions(&dest, perms).await?;
    }

    Ok(())
  }
}

/// Parse a `SHA2-256SUMS` file into a `{filename: hex_digest}` map. Each line
/// is `<64 hex>  <filename>` (two spaces, GNU coreutils format).
fn parse_sha_sums(text: &str) -> HashMap<String, String> {
  text
    .lines()
    .filter_map(|line| {
      let mut parts = line.split_whitespace();
      let hex = parts.next()?;
      let name = parts.next()?;
      Some((name.to_string(), hex.to_string()))
    })
    .collect()
}

/// Pick the correct yt-dlp release asset for the current target triple.
fn platform_asset_name() -> &'static str {
  if cfg!(target_os = "windows") {
    "yt-dlp.exe"
  } else if cfg!(target_os = "macos") {
    "yt-dlp_macos"
  } else if cfg!(target_os = "linux") {
    if cfg!(target_arch = "aarch64") {
      "yt-dlp_linux_aarch64"
    } else {
      "yt-dlp_linux"
    }
  } else {
    "yt-dlp"
  }
}

#[derive(Deserialize)]
struct GithubRelease {
  tag_name: String,
  #[serde(default)]
  assets: Vec<GithubAsset>,
}

#[derive(Deserialize)]
struct GithubAsset {
  name: String,
  browser_download_url: String,
}
