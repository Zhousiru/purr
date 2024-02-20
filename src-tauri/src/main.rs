// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
mod event_name;
mod utils;
mod whisper_server;

use std::sync::Mutex;
use tauri::{Manager, State, WindowEvent};
use whisper_server::commands::{kill_whisper_server, launch_whisper_server, list_models};
use whisper_server::daemon::Daemon;

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
    .on_window_event(move |event| match event.event() {
      WindowEvent::Destroyed => {
        let daemon: State<'_, WhisperServerDaemon> = event.window().state();
        let daemon = daemon.0.lock().unwrap();
        match *daemon {
          Some(ref daemon) => {
            daemon.kill();
          }
          _ => {}
        }
      }
      _ => {}
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
