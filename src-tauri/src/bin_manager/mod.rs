pub mod commands;
pub mod download;
pub mod ffmpeg;
mod install;
pub mod manager;
pub mod metadata;
pub mod path_probe;
mod progress;
pub mod spec;
pub mod status;
pub mod yt_dlp;

pub use manager::BinManager;
pub use spec::{executable_name, BinarySpec, ProgressFn, ReleaseAsset, ReleaseInfo};
