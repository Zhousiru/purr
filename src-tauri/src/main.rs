// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
mod utils;
mod whisper_server;

use whisper_server::daemon::Daemon;

use crate::whisper_server::commands::{kill_whisper_server, launch_whisper_server, list_models};
use std::sync::Mutex;

#[derive(Default)]
pub struct WhisperServerDaemon(Mutex<Option<Daemon>>);

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      list_models,
      launch_whisper_server,
      kill_whisper_server
    ])
    .manage(WhisperServerDaemon(Default::default()))
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
