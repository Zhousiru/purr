import {
  TerminalLineType,
  pushTerminalLine,
  resetTerminalLines,
  setIsReady,
  setIsRunning,
} from '@/atoms/whisper-server'
import { Event } from '@tauri-apps/api/event'

export function handleWhisperServerDaemon(
  event: Event<{ type: TerminalLineType; data: string | undefined }>,
) {
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
  }

  pushTerminalLine(event.payload.type, lineData)
}
