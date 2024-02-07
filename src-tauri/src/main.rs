// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
mod utils;
mod whisper_server;

use crate::whisper_server::commands::list_models;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![list_models])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
