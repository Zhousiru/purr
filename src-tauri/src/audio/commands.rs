use std::time::Instant;

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};

use super::{utils::calc_audio_duration, waveform::get_audio_samples};
use crate::{audio::waveform::extract_sample_extrema, error::CommandResult};

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

#[tauri::command]
pub async fn get_audio_waveform_data(path: String) -> CommandResult<String> {
  let now = Instant::now();
  let (samples, samples_per_sec) = get_audio_samples(&path)?;

  let result: Vec<Vec<Vec<f32>>> = samples
    .par_iter()
    .map(|channel| extract_sample_extrema(channel, samples_per_sec as usize, 75).unwrap())
    .collect();

  let elapsed = now.elapsed().as_millis();
  Ok(format!(
    "{} samples and {} seconds extrema generated in {}ms.",
    samples[0].len(),
    result[0].len(),
    elapsed
  ))
}
