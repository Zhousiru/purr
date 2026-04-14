use std::{fs::File, path::Path};

use anyhow::anyhow;
use symphonia::{
  core::{
    codecs::{CodecParameters, Decoder, DecoderOptions},
    formats::{FormatOptions, FormatReader, Track},
    io::MediaSourceStream,
    meta::MetadataOptions,
    probe::Hint,
    units::Time,
  },
  default,
};

use crate::error::CommandResult;

pub fn get_audio_reader(path: &str) -> CommandResult<Box<dyn FormatReader>> {
  let path = Path::new(&path);
  let input = File::open(path)?;
  let ext = path.extension().unwrap().to_str().unwrap();

  let stream = MediaSourceStream::new(Box::new(input), Default::default());
  let mut hint = Hint::new();
  hint.with_extension(ext);

  let meta_opts: MetadataOptions = Default::default();
  let fmt_opts: FormatOptions = Default::default();

  let probe = symphonia::default::get_probe();
  let probed = probe.format(&hint, stream, &fmt_opts, &meta_opts)?;
  let reader = probed.format;

  Ok(reader)
}

pub fn get_audio_decoder(codec_params: &CodecParameters) -> CommandResult<Box<dyn Decoder>> {
  let codecs = default::get_codecs();
  let decoder = codecs.make(codec_params, &DecoderOptions { verify: true })?;
  Ok(decoder)
}

pub fn find_audio_track(reader: &dyn FormatReader) -> CommandResult<&Track> {
  let codecs = default::get_codecs();
  reader
    .tracks()
    .iter()
    .find(|t| codecs.get_codec(t.codec_params.codec).is_some())
    .ok_or_else(|| anyhow!("no decodable audio track").into())
}

pub fn calc_audio_duration(path: &str) -> CommandResult<Time> {
  let reader = get_audio_reader(path)?;
  let track = find_audio_track(&*reader)?;
  let codec_params = &track.codec_params;
  let time_base = codec_params
    .time_base
    .ok_or(anyhow!("no time_base in the default track"))?;
  let n_frames = codec_params
    .n_frames
    .ok_or(anyhow!("no n_frames in the default track"))?;
  let duration = time_base.calc_time(n_frames);

  Ok(duration)
}
