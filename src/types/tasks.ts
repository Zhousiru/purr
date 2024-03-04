export type TaskStatus = 'stopped' | 'queued' | 'processing' | 'done'

export interface BasicTask {
  name: string
  group: string
  status: TaskStatus
  creationTimestamp: number
}

export interface AudioMeta {
  length: number
}

export interface Transcription {
  start: number
  end: number
  text: string
}

export interface Translation extends Transcription {
  translated: string
}

export interface TranscribeOptions {
  sourcePath: string
  sourceMeta: AudioMeta
  language: string | null
  translateWith: Omit<TranslateOptions, 'transcription'> | null
}

export interface TranscribeResult {
  progress: number
  transcription: Transcription[]
}

export interface TranscribeTask extends BasicTask {
  type: 'transcribe'
  options: TranscribeOptions
  result: TranscribeResult | null
}

export interface TranslateOptions {
  transcription: Transcription[]
  prompt: string
  batchSize: number
}

export interface TranslateResult {
  progress: number
  translation: Translation[]
}

export interface TranslateTask extends BasicTask {
  type: 'translate'
  options: TranslateOptions
  result: TranslateResult | null
}

export type BasicTaskOptions = Omit<BasicTask, 'status' | 'creationTimestamp'>

export type Task = TranscribeTask | TranslateTask
