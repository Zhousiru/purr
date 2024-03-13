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

export function handleWhisperServerDaemon(event: Event<DaemonEventPayload>) {
  const lineData = event.payload.data ?? ''

  switch (event.payload.type) {
    case 'launch':
      resetTerminalLines()
      setIsRunning(true)
      break

    case 'exit':
      setIsReady(false)
      setIsRunning(false)
      break
  }

  if (/INFO:\s*Uvicorn running on/.test(lineData)) {
    setIsReady(true)

    const config = getWhisperServerConfig()
    getMonitor().reconnect(`http://${config.host}:${config.port}`)
  }

  pushTerminalLine(event.payload.type, lineData)

  daemonSubject.next(event.payload)
}
