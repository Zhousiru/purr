use anyhow::anyhow;
use rayon::iter::{IntoParallelIterator, ParallelIterator};
use symphonia::core::{
  audio::{AudioBuffer, Signal},
  errors::Error,
};

use super::utils::{get_audio_decoder, get_audio_reader};
use crate::error::CommandResult;

pub fn get_audio_samples(path: &str) -> CommandResult<(Vec<Vec<f32>>, u32)> {
  let mut reader = get_audio_reader(path)?;
  let track = reader.default_track().ok_or(anyhow!("no default track"))?;

  let track_id = track.id;
  let codec_params = &track.codec_params;

  let mut decoder = get_audio_decoder(&codec_params)?;

  let channel_count = codec_params
    .channels
    .ok_or(anyhow!("no channels in the default track"))?
    .count();
  let samples_per_sec = codec_params
    .time_base
    .ok_or(anyhow!("no time_base in the default track"))?
    .denom;

  let mut samples: Vec<Vec<f32>> = Vec::new();

  for _ in 0..channel_count {
    samples.push(Vec::new());
  }

  loop {
    let packet = match reader.next_packet() {
      Ok(packet) => packet,
      Err(_) => break,
    };

    if packet.track_id() != track_id {
      continue;
    }

    let decoded = match decoder.decode(&packet) {
      Ok(d) => d,
      Err(Error::IoError(_)) => {
        continue;
      }
      Err(Error::DecodeError(_)) => {
        continue;
      }
      Err(e) => return Err(e.into()),
    };

    let mut buffer: AudioBuffer<f32> =
      AudioBuffer::new(decoded.capacity() as u64, decoded.spec().clone());

    decoded.convert(&mut buffer);

    for i in 0..channel_count {
      let channel_samples = buffer.chan(i);
      samples[i].extend(channel_samples)
    }
  }

  Ok((samples, samples_per_sec))
}

pub fn get_chunk_extrema(chunk: &[f32]) -> (f32, f32) {
  let max = chunk.iter().fold(f32::MIN, |a, &b| a.max(b));
  let min = chunk.iter().fold(f32::MAX, |a, &b| a.min(b));

  (max, min)
}

pub fn extract_sample_extrema(
  samples: &Vec<f32>,
  samples_per_sec: usize,
  pair_per_sec: usize,
) -> CommandResult<Vec<f32>> {
  let samples_per_pair = samples_per_sec / pair_per_sec;
  let secs = samples.len() / samples_per_sec;

  // We process samples in seconds to avoid error accumulation.
  let mut result: Vec<f32> = (0..secs)
    .into_par_iter()
    .flat_map(|sec| {
      let sec_start = sec * samples_per_sec;

      let mut chunk_result = Vec::new();

      for chunk in 0..pair_per_sec {
        let start = sec_start + chunk * samples_per_pair;
        let end = start + samples_per_pair;

        let chunk_samples = &samples[start..end];
        let (max, min) = get_chunk_extrema(chunk_samples);

        chunk_result.push(max);
        chunk_result.push(min);
      }

      chunk_result
    })
    .collect();

  let rest = samples.len() - secs * samples_per_sec;

  // Process the remaining samples.
  if rest > 0 {
    let mut chunk_result = Vec::new();

    for chunk in 0..rest / samples_per_pair {
      let start = secs * samples_per_sec + chunk * samples_per_pair;
      let end = start + samples_per_pair;

      let chunk_samples = &samples[start..end];
      let (max, min) = get_chunk_extrema(chunk_samples);

      chunk_result.push(max);
      chunk_result.push(min);
    }

    result.extend(chunk_result);
  }

  Ok(result)
}
