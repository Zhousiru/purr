import {
  BinaryStatusEvent,
  setBinaryStatus,
} from '@/atoms/bin-status'
import {
  applyNotificationEvent,
  NotificationEvent,
  upsertNotification,
} from '@/atoms/notifications'
import {
  getMonitor,
  getWhisperServerConfig,
  pushTerminalLine,
  resetTerminalLines,
  setIsReady,
  setIsRunning,
} from '@/atoms/whisper-server'
import { DaemonEventPayload } from '@/types/events'
import { Event } from '@tauri-apps/api/event'
import { daemonSubject } from './subjects'

// Single-card lifecycle id so Starting → Ready → Stopped transitions replace
// in place rather than stacking three entries on the notifications page.
const WHISPER_NOTE_ID = 'whisper-server'

export function handleWhisperServerDaemon(event: Event<DaemonEventPayload>) {
  const lineData = event.payload.data ?? ''

  switch (event.payload.type) {
    case 'launch':
      resetTerminalLines()
      setIsRunning(true)
      upsertNotification({
        id: WHISPER_NOTE_ID,
        type: 'progress',
        title: 'Whisper server starting',
        silent: true,
      })
      break

    case 'exit':
      setIsReady(false)
      setIsRunning(false)
      upsertNotification({
        id: WHISPER_NOTE_ID,
        type: 'info',
        title: 'Whisper server stopped',
        silent: true,
      })
      break
  }

  if (/INFO:\s*Uvicorn running on/.test(lineData)) {
    setIsReady(true)

    const config = getWhisperServerConfig()
    getMonitor().reconnect(`http://${config.host}:${config.port}`)

    upsertNotification({
      id: WHISPER_NOTE_ID,
      type: 'success',
      title: 'Whisper server ready',
      desc: `${config.host}:${config.port}`,
      silent: true,
    })
  }

  pushTerminalLine(event.payload.type, lineData)

  daemonSubject.next(event.payload)

  console.log(`DaemonEvent.${event.payload.type}`, lineData)
}

export function handleNotification(event: Event<NotificationEvent>) {
  applyNotificationEvent(event.payload)
}

export function handleBinaryStatus(event: Event<BinaryStatusEvent>) {
  setBinaryStatus(event.payload.id, event.payload.status)
}
