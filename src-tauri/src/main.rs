// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod error;
mod event_name;
mod utils;
mod whisper_server;

use std::sync::Mutex;

use tauri::{Manager, State, WindowEvent};

use crate::{
  audio::commands::{get_audio_durations, get_audio_waveform_data},
  whisper_server::{
    commands::{
      is_whisper_server_running, kill_whisper_server, launch_whisper_server, list_models,
      submit_transcription_task,
    },
    daemon::Daemon,
  },
};

#[derive(Default)]
pub struct WhisperServerDaemon(Mutex<Option<Daemon>>);

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      list_models,
      launch_whisper_server,
      kill_whisper_server,
      get_audio_durations,
      submit_transcription_task,
      is_whisper_server_running,
      get_audio_waveform_data
    ])
    .manage(WhisperServerDaemon(Default::default()))
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
