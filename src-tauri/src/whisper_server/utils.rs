use crate::error::CommandResult;
use anyhow::anyhow;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TaskOptions {
  pub lang: String,
  pub prompt: String,
  pub vad: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct NamedPath {
  pub name: String,
  pub path: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct ApiResponse {
  status: String,
  msg: Option<String>,
}

pub fn submit_task(
  client: &reqwest::blocking::Client,
  url: &str,
  named_path: &NamedPath,
  options: &TaskOptions,
) -> CommandResult<()> {
  let form = reqwest::blocking::multipart::Form::new().file("file", &named_path.path)?;

  let resp: ApiResponse = client
    .post(url)
    .query(&[
      ("name", &named_path.name),
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
