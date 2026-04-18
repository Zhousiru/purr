// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod bin_manager;
mod error;
mod event_name;
mod notify;
mod utils;
mod whisper_server;
mod yt_dlp;

use std::sync::{Arc, Mutex};

use tauri::{Manager, State, WindowEvent};

use crate::{
  audio::commands::{get_audio_durations, get_audio_waveform_data},
  bin_manager::commands::{get_binary_statuses, retry_binary},
  notify::get_initial_notifications,
  whisper_server::{
    commands::{
      is_whisper_server_running, kill_whisper_server, launch_whisper_server, list_models,
      submit_transcription_task,
    },
    daemon::Daemon,
  },
  yt_dlp::commands::{cancel_download, download_from_url, fetch_url_metadata},
  yt_dlp::state::YtDlpState,
};

#[derive(Default)]
pub struct WhisperServerDaemon(Mutex<Option<Daemon>>);

fn main() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_prevent_default::Builder::new()
        .with_flags(tauri_plugin_prevent_default::Flags::all())
        .build(),
    )
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      list_models,
      launch_whisper_server,
      kill_whisper_server,
      get_audio_durations,
      submit_transcription_task,
      is_whisper_server_running,
      get_audio_waveform_data,
      fetch_url_metadata,
      download_from_url,
      cancel_download,
      get_binary_statuses,
      retry_binary,
      get_initial_notifications
    ])
    .manage(WhisperServerDaemon(Default::default()))
    .manage(notify::NotificationState::default())
    .manage(YtDlpState::default())
    .setup(|app| {
      let app_data_dir = app.path().app_data_dir()?;
      let bin_dir = app_data_dir.join("bin");
      let manager = Arc::new(bin_manager::BinManager::new(
        bin_dir,
        app.handle().clone(),
        vec![
          Arc::new(bin_manager::yt_dlp::YtDlpSpec),
          Arc::new(bin_manager::ffmpeg::FfmpegSpec),
        ],
      ));
      app.manage(manager.clone());
      tauri::async_runtime::spawn(async move {
        if let Err(e) = manager.ensure_all().await {
          eprintln!("[bin_manager] ensure_all failed: {e:#}");
          return;
        }
        manager.spawn_background_updates();
      });
      Ok(())
    })
    .on_window_event(|window, event| {
      if let WindowEvent::Destroyed = event {
        let daemon: State<'_, WhisperServerDaemon> = window.state();
        let daemon = daemon.0.lock().unwrap();
        if let Some(ref daemon) = *daemon {
          daemon.kill();
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
