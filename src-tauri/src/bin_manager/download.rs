#![allow(dead_code)]

use std::path::Path;

use sha2::{Digest, Sha256};
use tokio::io::AsyncWriteExt;

pub struct DownloadOutcome {
  pub sha256_hex: String,
  pub bytes: u64,
}

/// Stream `url` into `dest`, reporting `(downloaded, total)` on every chunk
/// and computing a SHA256 of the payload. `total` is `None` when the server
/// omits `Content-Length`. Callers throttle the callback themselves — the
/// helper fires unconditionally on each chunk.
pub async fn download_to_file<F>(
  http: &reqwest::Client,
  url: &str,
  dest: &Path,
  mut on_progress: F,
) -> anyhow::Result<DownloadOutcome>
where
  F: FnMut(u64, Option<u64>),
{
  if let Some(parent) = dest.parent() {
    tokio::fs::create_dir_all(parent).await?;
  }

  let mut resp = http.get(url).send().await?.error_for_status()?;
  let total = resp.content_length();

  let mut file = tokio::fs::File::create(dest).await?;
  let mut hasher = Sha256::new();
  let mut downloaded: u64 = 0;

  on_progress(0, total);

  while let Some(chunk) = resp.chunk().await? {
    hasher.update(&chunk);
    file.write_all(&chunk).await?;
    downloaded += chunk.len() as u64;
    on_progress(downloaded, total);
  }

  file.flush().await?;
  file.sync_all().await?;
  drop(file);

  let digest = hasher.finalize();
  let mut hex = String::with_capacity(64);
  for b in digest.iter() {
    use std::fmt::Write as _;
    let _ = write!(hex, "{b:02x}");
  }

  Ok(DownloadOutcome {
    sha256_hex: hex,
    bytes: downloaded,
  })
}

/// Convenience for small text assets (e.g. `SHA2-256SUMS`).
pub async fn fetch_text(http: &reqwest::Client, url: &str) -> anyhow::Result<String> {
  Ok(
    http
      .get(url)
      .send()
      .await?
      .error_for_status()?
      .text()
      .await?,
  )
}
