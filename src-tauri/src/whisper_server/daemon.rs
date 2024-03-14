use std::{
  io::{BufRead, BufReader},
  process::{Command, Stdio},
  sync::{mpsc, Arc},
  thread,
};

use shared_child::SharedChild;
use tauri::{AppHandle, Manager};

use super::events::WhisperServerEvent;
use crate::{event_name, whisper_server::utils::get_path_env, WhisperServerDaemon};

pub struct Daemon {
  kill_tx: mpsc::Sender<bool>,
}

impl Daemon {
  pub fn kill(&self) {
    self.kill_tx.send(true).unwrap();
  }
}

pub fn spawn_daemon(base_path: String, args: Vec<String>, app: AppHandle) -> Daemon {
  let (tx, rx) = mpsc::channel();
  let tx_clone = tx.clone();

  app
    .emit_all(
      event_name::WHISPER_SERVER_DAEMON,
      WhisperServerEvent::Launch,
    )
    .unwrap();

  let mut command = Command::new("python");

  command
    .env("PATH", get_path_env(&base_path))
    .args(args)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped());

  let shared_process = SharedChild::spawn(&mut command).unwrap();
  let process_arc = Arc::new(shared_process);

  let stdout = process_arc.take_stdout().unwrap();
  let stderr = process_arc.take_stderr().unwrap();

  let stdout_app = app.clone();
  thread::spawn(move || {
    let stdout_lines = BufReader::new(stdout).lines();
    for line in stdout_lines {
      stdout_app
        .emit_all(
          event_name::WHISPER_SERVER_DAEMON,
          WhisperServerEvent::Stdout(line.unwrap()),
        )
        .unwrap();
    }
  });

  let stderr_app = app.clone();
  thread::spawn(move || {
    let stderr_lines = BufReader::new(stderr).lines();
    for line in stderr_lines {
      stderr_app
        .emit_all(
          event_name::WHISPER_SERVER_DAEMON,
          WhisperServerEvent::Stderr(line.unwrap()),
        )
        .unwrap();
    }
  });

  let process_arc_clone = process_arc.clone();
  thread::spawn(move || {
    process_arc_clone.wait().unwrap();

    app
      .emit_all(event_name::WHISPER_SERVER_DAEMON, WhisperServerEvent::Exit)
      .unwrap();

    tx_clone.send(false).ok();
    let daemon: tauri::State<WhisperServerDaemon> = app.state();
    let mut daemon = daemon.0.lock().unwrap();
    *daemon = None;
  });

  let process_arc_clone = process_arc.clone();
  thread::spawn(move || {
    if rx.recv().unwrap() {
      process_arc_clone.kill().unwrap()
    }
  });

  Daemon { kill_tx: tx }
}
