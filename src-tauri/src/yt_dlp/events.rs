#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
}
