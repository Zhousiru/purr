#![allow(dead_code)]

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
  pub last_updated: u64,
}

/// Payload emitted on `event_name::NOTIFICATION`. Action-tagged so the
/// frontend reducer is trivial.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum NotificationEvent {
  Upsert { notification: Notification },
  Remove { id: String },
}

#[derive(Default)]
pub struct NotificationState {
  inner: Mutex<HashMap<String, Notification>>,
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

/// Full upsert — create a new notification or replace an existing one.
pub fn upsert(app: &AppHandle, mut notification: Notification) {
  notification.last_updated = now_ms();
  let state = app.state::<NotificationState>();
  let mut guard = state.inner.lock().unwrap();
  guard.insert(notification.id.clone(), notification.clone());
  drop(guard);
  emit(app, NotificationEvent::Upsert { notification });
}

/// Patch `progress` on an existing notification. No-op if `id` is unknown.
/// Emits `last_updated` bumped. Does not change `type`.
pub fn update_progress(app: &AppHandle, id: &str, progress: f32) {
  let state = app.state::<NotificationState>();
  let notification = {
    let mut guard = state.inner.lock().unwrap();
    let Some(n) = guard.get_mut(id) else {
      return;
    };
    n.progress = Some(progress.clamp(0.0, 1.0));
    n.last_updated = now_ms();
    n.clone()
  };
  emit(app, NotificationEvent::Upsert { notification });
}

/// Transition a notification to the `success` type. Leaves existing title in
/// place; optional `desc` replaces the previous description.
pub fn succeed(app: &AppHandle, id: &str, desc: Option<String>) {
  transition(app, id, NotificationType::Success, desc, Some(1.0));
}

/// Transition a notification to the `error` type with a required description.
pub fn fail(app: &AppHandle, id: &str, desc: impl Into<String>) {
  transition(
    app,
    id,
    NotificationType::Error,
    Some(desc.into()),
    None,
  );
}

fn transition(
  app: &AppHandle,
  id: &str,
  kind: NotificationType,
  desc: Option<String>,
  progress: Option<f32>,
) {
  let state = app.state::<NotificationState>();
  let notification = {
    let mut guard = state.inner.lock().unwrap();
    let Some(n) = guard.get_mut(id) else {
      return;
    };
    n.kind = kind;
    if desc.is_some() {
      n.desc = desc;
    }
    if progress.is_some() {
      n.progress = progress;
    }
    n.last_updated = now_ms();
    n.clone()
  };
  emit(app, NotificationEvent::Upsert { notification });
}

pub fn remove(app: &AppHandle, id: &str) {
  let state = app.state::<NotificationState>();
  state.inner.lock().unwrap().remove(id);
  emit(
    app,
    NotificationEvent::Remove {
      id: id.to_string(),
    },
  );
}
