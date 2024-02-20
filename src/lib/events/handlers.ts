import {
  TerminalLineType,
  pushTerminalLine,
  resetTerminalLines,
  setIsRunning,
} from '@/atoms/whisper-server'
import { Event } from '@tauri-apps/api/event'

export function handleWhisperServerDaemon(
  event: Event<{ type: TerminalLineType; data: string | undefined }>,
) {
  switch (event.payload.type) {
    case 'launch':
      resetTerminalLines()
      setIsRunning(true)
      break

    case 'exit':
      setIsRunning(false)
      break
  }

  pushTerminalLine(event.payload.type, event.payload.data ?? '')
}
