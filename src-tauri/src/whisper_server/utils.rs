use std::{
  env,
  path::{Path, PathBuf},
};

use anyhow::anyhow;

use crate::error::CommandResult;

pub fn get_path_env(base_path: &str) -> String {
  let existed = env::var_os("PATH").unwrap();
  let existed: Vec<PathBuf> = env::split_paths(&existed).collect();

  let mut new = Vec::new();

  // For Windows below.
  new.push(PathBuf::from(base_path));
  new.push(Path::new(base_path).join("Library").join("bin"));
  new.push(Path::new(base_path).join("Scripts"));

  // For Linux below.
  new.push(Path::new(base_path).join("bin"));

  new.extend(existed);

  env::join_paths(new).unwrap().to_string_lossy().into()
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TaskOptions {
  pub lang: String,
  pub prompt: String,
  pub vad: bool,
}

#[derive(Debug, serde::Deserialize)]
pub struct ApiResponse {
  status: String,
  msg: Option<String>,
}

pub fn submit_task(url: &str, name: &str, path: &str, options: &TaskOptions) -> CommandResult<()> {
  let client = reqwest::blocking::Client::new();
  let form = reqwest::blocking::multipart::Form::new().file("file", path)?;

  let resp: ApiResponse = client
    .post(url)
    .query(&[
      ("name", name),
      ("lang", &options.lang),
      ("prompt", &options.prompt),
      ("vad", &options.vad.to_string()),
    ])
    .multipart(form)
    .send()?
    .json()?;

  if resp.status != "ok" {
    Err(
      anyhow!(
        "Whisper server returned an error: {}",
        resp.msg.unwrap_or("Unknown error.".to_string())
      )
      .into(),
    )
  } else {
    Ok(())
  }
}
