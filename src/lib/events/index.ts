import { EventCallback, UnlistenFn, listen } from '@tauri-apps/api/event'
import { handleWhisperServerDaemon } from './handlers'

const eventMap: [string, EventCallback<any>][] = [
  ['app://whisper-server-daemon', handleWhisperServerDaemon],
]

const unlistenFns: Promise<UnlistenFn>[] = []

export function registerEvents() {
  for (const [eventName, eventHandler] of eventMap) {
    unlistenFns.push(listen(eventName, eventHandler))
  }

  return unlistenEvents
}

function unlistenEvents() {
  while (unlistenFns.length > 0) {
    unlistenFns.pop()!.then((fn) => fn())
  }
}
