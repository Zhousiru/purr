use std::path::PathBuf;

use tokio::sync::Mutex;
use yt_dlp::client::deps::LibraryInstaller;
use yt_dlp::utils::find_executable;

pub struct YtDlpBinaries {
    pub yt_dlp: PathBuf,
    pub ffmpeg: PathBuf,
}

pub struct YtDlpState(pub Mutex<Option<YtDlpBinaries>>);

impl Default for YtDlpState {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

pub async fn ensure_binaries(
    app_data_dir: PathBuf,
    state: &YtDlpState,
) -> anyhow::Result<()> {
    let mut guard = state.0.lock().await;
    if guard.is_some() {
        return Ok(());
    }

    let libs_dir = app_data_dir.join("yt-dlp-libs");
    std::fs::create_dir_all(&libs_dir)?;

    let yt_dlp_path = libs_dir.join(find_executable("yt-dlp"));
    let ffmpeg_path = libs_dir.join(find_executable("ffmpeg"));

    let yt_dlp = if yt_dlp_path.exists() {
        yt_dlp_path
    } else {
        let installer = LibraryInstaller::new(libs_dir.clone());
        installer
            .install_youtube(None)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to install yt-dlp: {}", e))?
    };

    let ffmpeg = if ffmpeg_path.exists() {
        ffmpeg_path
    } else {
        let installer = LibraryInstaller::new(libs_dir.clone());
        installer
            .install_ffmpeg(None)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to install ffmpeg: {}", e))?
    };

    *guard = Some(YtDlpBinaries { yt_dlp, ffmpeg });
    Ok(())
}
