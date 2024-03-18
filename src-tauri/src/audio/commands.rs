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

#[derive(Debug, serde::Serialize)]
pub struct WaveformResult {
  data: Option<Vec<Vec<f32>>>,
  error: Option<String>,
}

#[tauri::command]
pub async fn get_audio_waveform_data(
  path: String,
  pair_per_sec: usize,
) -> CommandResult<Vec<WaveformResult>> {
  let (samples, samples_per_sec) = get_audio_samples(&path)?;
  let result: Vec<WaveformResult> = samples
    .par_iter()
    .map(
      |channel| match extract_sample_extrema(channel, samples_per_sec as usize, pair_per_sec) {
        Ok(d) => WaveformResult {
          data: Some(d),
          error: None,
        },
        Err(e) => WaveformResult {
          data: None,
          error: Some(e.to_string()),
        },
      },
    )
    .collect();

  Ok(result)
}
