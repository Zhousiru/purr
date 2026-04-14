import { EventCallback, UnlistenFn, listen } from '@tauri-apps/api/event'
import { handleNotification, handleWhisperServerDaemon } from './handlers'

const eventMap = [
  ['app://whisper-server-daemon', handleWhisperServerDaemon],
  ['app://notification', handleNotification],
] as const

const unlistenFns: Promise<UnlistenFn>[] = []

export function registerEvents() {
  for (const [eventName, eventHandler] of eventMap) {
    unlistenFns.push(listen(eventName, eventHandler as EventCallback<never>))
  }

  return unlistenEvents
}

function unlistenEvents() {
  while (unlistenFns.length > 0) {
    unlistenFns.pop()!.then((fn) => fn())
  }
}
