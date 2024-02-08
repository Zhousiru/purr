#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", content = "data")]
#[serde(rename_all = "camelCase")]
pub enum WhisperServerEvent {
  Launch,
  Stdout(String),
  Stderr(String),
  Exit,
}
