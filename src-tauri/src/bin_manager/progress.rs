use std::sync::Mutex;
use std::time::{Duration, Instant};

/// Rate-limits progress callback fan-out. The install runner fires
/// notification + status updates through the same throttle so a single
/// gate controls both downstreams.
///
/// Accepts a tick when either: (a) the configured interval has elapsed
/// since the last accepted tick, or (b) the download reports it as final
/// (`downloaded >= total`), so the terminal 100% tick is never dropped.
pub struct ProgressThrottle {
  interval: Duration,
  last: Mutex<Option<Instant>>,
}

impl ProgressThrottle {
  pub fn new(interval: Duration) -> Self {
    Self {
      interval,
      last: Mutex::new(None),
    }
  }

  pub fn should_emit(&self, downloaded: u64, total: u64) -> bool {
    let mut last = self.last.lock().unwrap();
    let now = Instant::now();
    let is_final = downloaded >= total;
    let elapsed_ok = match *last {
      Some(t) => now.duration_since(t) >= self.interval,
      None => true,
    };
    if elapsed_ok || is_final {
      *last = Some(now);
      true
    } else {
      false
    }
  }
}
