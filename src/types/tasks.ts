export type TaskStatus = 'stopped' | 'queued' | 'processing' | 'done'

export interface BasicTask {
  name: string
  group: string
  status: TaskStatus
  relatedTaskName: string | null
  creationTimestamp: number
}

export interface AudioMeta {
  duration: number
}

export interface Transcript {
  start: number
  end: number
  text: string
}

export interface Translation extends Transcript {
  translated: string
}

export interface TranscribeOptions {
  sourcePath: string
  sourceMeta: AudioMeta
  language: string
  prompt: string
  vadFilter: boolean
  translateWith: Omit<TranslateOptions, 'transcription'> | null
}

export interface TranscribeResult {
  progress: number
  data: Transcript[]
}

export interface TranscribeTask extends BasicTask {
  type: 'transcribe'
  options: TranscribeOptions
  result: TranscribeResult | null
}

export interface TranslateOptions {
  transcription: Transcript[]
  model: string
  prompt: string
  batchSize: number
}

export interface TranslateResult {
  progress: number
  data: Translation[]
}

export interface TranslateTask extends BasicTask {
  type: 'translate'
  options: TranslateOptions
  result: TranslateResult | null
}

export type BasicTaskOptions = Omit<BasicTask, 'status' | 'creationTimestamp'>

export type Task = TranscribeTask | TranslateTask
