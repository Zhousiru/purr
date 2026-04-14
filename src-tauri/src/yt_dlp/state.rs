use std::sync::{Arc, Mutex};

use tokio::sync::Notify;

/// Shared state for in-flight yt-dlp downloads. Holds a single cancel handle
/// because the UI only allows one active URL import at a time — starting a
/// new download overwrites the slot, which is fine since the previous
/// download would already be finished or cancelled by the UI flow.
#[derive(Default)]
pub struct YtDlpState(pub Mutex<Option<Arc<Notify>>>);
