use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use crate::event_name;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NotificationType {
  Progress,
  Success,
  Error,
  Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Notification {
  pub id: String,
  #[serde(rename = "type")]
  pub kind: NotificationType,
  pub title: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub desc: Option<String>,
  /// 0.0..=1.0 when known; `None` for indeterminate / non-progress types.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub progress: Option<f32>,
  /// When true the frontend skips the toast and only logs the entry on
  /// the notifications page.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub silent: Option<bool>,
  pub last_updated: u64,
}

impl Notification {
  /// `last_updated` is stamped by `upsert`, callers leave it at 0.
  pub fn new(
    id: impl Into<String>,
    kind: NotificationType,
    title: impl Into<String>,
  ) -> Self {
    Self {
      id: id.into(),
      kind,
      title: title.into(),
      desc: None,
      progress: None,
      silent: None,
      last_updated: 0,
    }
  }

  pub fn with_desc(mut self, desc: impl Into<String>) -> Self {
    self.desc = Some(desc.into());
    self
  }

  #[allow(dead_code)]
  pub fn with_progress(mut self, progress: f32) -> Self {
    self.progress = Some(progress.clamp(0.0, 1.0));
    self
  }

  pub fn silent(mut self) -> Self {
    self.silent = Some(true);
    self
  }
}

/// Partial update for an in-flight entry. Frontend merges into the
/// existing atom; missing id is a no-op.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationPatch {
  pub id: String,
  #[serde(skip_serializing_if = "Option::is_none", rename = "type")]
  pub kind: Option<NotificationType>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub desc: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub progress: Option<f32>,
}

/// Action-tagged event on `event_name::NOTIFICATION`.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum NotificationEvent {
  Upsert { notification: Notification },
  Patch { patch: NotificationPatch },
  Remove { id: String },
}

/// Boot replay buffer. `Some` until the webview drains it via
/// `get_initial_notifications`; `None` afterwards — at that point the
/// backend is fully stateless and events flow live-only.
pub struct NotificationState {
  inner: Mutex<Option<HashMap<String, Notification>>>,
}

impl Default for NotificationState {
  fn default() -> Self {
    Self {
      inner: Mutex::new(Some(HashMap::new())),
    }
  }
}

fn now_ms() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis() as u64)
    .unwrap_or(0)
}

fn emit(app: &AppHandle, event: NotificationEvent) {
  let _ = app.emit(event_name::NOTIFICATION, event);
}

/// Insert or replace an entry, stamping `last_updated`.
pub fn upsert(app: &AppHandle, mut notification: Notification) {
  notification.last_updated = now_ms();
  let state = app.state::<NotificationState>();
  if let Some(buf) = state.inner.lock().unwrap().as_mut() {
    buf.insert(notification.id.clone(), notification.clone());
  }
  emit(app, NotificationEvent::Upsert { notification });
}

fn patch(app: &AppHandle, p: NotificationPatch) {
  if let Some(buf) = app.state::<NotificationState>().inner.lock().unwrap().as_mut() {
    if let Some(n) = buf.get_mut(&p.id) {
      if let Some(k) = p.kind {
        n.kind = k;
      }
      if let Some(d) = &p.desc {
        n.desc = Some(d.clone());
      }
      if let Some(pr) = p.progress {
        n.progress = Some(pr);
      }
      n.last_updated = now_ms();
    }
  }
  emit(app, NotificationEvent::Patch { patch: p });
}

/// Patch progress only. Title/kind/desc untouched.
pub fn update_progress(app: &AppHandle, id: &str, progress: f32) {
  patch(
    app,
    NotificationPatch {
      id: id.into(),
      kind: None,
      desc: None,
      progress: Some(progress.clamp(0.0, 1.0)),
    },
  );
}

/// Transition to `success` (and 100% progress). Optional new desc.
pub fn succeed(app: &AppHandle, id: &str, desc: Option<String>) {
  patch(
    app,
    NotificationPatch {
      id: id.into(),
      kind: Some(NotificationType::Success),
      desc,
      progress: Some(1.0),
    },
  );
}

/// Transition to `error` with a required desc.
pub fn fail(app: &AppHandle, id: &str, desc: impl Into<String>) {
  patch(
    app,
    NotificationPatch {
      id: id.into(),
      kind: Some(NotificationType::Error),
      desc: Some(desc.into()),
      progress: None,
    },
  );
}

pub fn remove(app: &AppHandle, id: &str) {
  if let Some(buf) = app.state::<NotificationState>().inner.lock().unwrap().as_mut() {
    buf.remove(id);
  }
  emit(app, NotificationEvent::Remove { id: id.to_string() });
}

/// One-shot boot hydration — drains the replay buffer. Subsequent calls
/// return empty; live updates flow through the event channel.
#[tauri::command]
pub async fn get_initial_notifications(app: AppHandle) -> Vec<Notification> {
  app
    .state::<NotificationState>()
    .inner
    .lock()
    .unwrap()
    .take()
    .map(|m| m.into_values().collect())
    .unwrap_or_default()
}
