export interface WhisperServerConfig {
  startupDir: string
  host: string
  port: number
  device: 'auto' | 'cpu' | 'cuda'
  quantizationType: string
  modelDir: string
  model: string
}

export type DaemonEventType = 'launch' | 'exit' | 'stdout' | 'stderr'

export interface TerminalLine {
  type: DaemonEventType
  data: string
}

export interface ModelItem {
  name: string
  size: number
}

export type ApiResponse =
  | {
      status: 'ok'
      msg: null
    }
  | {
      status: 'error'
      msg: string
    }

export interface MonitorEventBase {
  taskName: string
  type: string
  data: unknown
}

export interface MonitorEventStatus extends MonitorEventBase {
  type: 'status'
  data: 'init' | 'start' | 'done' | 'canceled'
}

export interface MonitorEventLanguageDetection extends MonitorEventBase {
  type: 'language-detection'
  data: string
}

export interface MonitorEventTranscription extends MonitorEventBase {
  type: 'transcription'
  data: {
    start: number
    end: number
    text: string
  }
}

export type MonitorEvent =
  | MonitorEventStatus
  | MonitorEventLanguageDetection
  | MonitorEventTranscription
