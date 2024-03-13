import { DaemonEventType } from './whisper-server'

export interface DaemonEventPayload {
  type: DaemonEventType
  data: string | undefined
}
