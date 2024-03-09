use rayon::prelude::*;

use super::utils::calc_audio_duration;

#[derive(Debug, serde::Serialize)]
pub struct DurationResult {
  path: String,
  duration: Option<u64>,
  error: Option<String>,
}

#[tauri::command]
pub async fn get_audio_durations(paths: Vec<String>) -> Vec<DurationResult> {
  paths
    .par_iter()
    .map(|path| {
      let duration;
      let error;

      match calc_audio_duration(path) {
        Ok(time) => {
          duration = Some(time.seconds + time.frac.round() as u64);
          error = None;
        }
        Err(e) => {
          duration = None;
          error = Some(e.to_string());
        }
      }

      DurationResult {
        path: path.clone(),
        duration,
        error,
      }
    })
    .collect()
}
