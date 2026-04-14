#![allow(dead_code)]

use std::path::PathBuf;

/// Walk `$PATH` (plus `$PATHEXT` on Windows) looking for `name`. Returns the
/// full path to the first match. `name` should be the bare base (e.g.
/// `ffmpeg`, not `ffmpeg.exe`) — the probe adds platform extensions itself.
pub fn find(name: &str) -> Option<PathBuf> {
  let path = std::env::var_os("PATH")?;

  let exts: Vec<String> = if cfg!(windows) {
    let pathext = std::env::var("PATHEXT").unwrap_or_else(|_| ".EXE;.CMD;.BAT".into());
    let mut v: Vec<String> = pathext
      .split(';')
      .filter(|s| !s.is_empty())
      .map(|s| s.to_string())
      .collect();
    v.insert(0, String::new());
    v
  } else {
    vec![String::new()]
  };

  for dir in std::env::split_paths(&path) {
    for ext in &exts {
      let candidate = dir.join(format!("{name}{ext}"));
      if candidate.is_file() {
        return Some(candidate);
      }
    }
  }
  None
}
