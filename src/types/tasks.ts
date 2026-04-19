export type TaskStatus = 'stopped' | 'queued' | 'processing' | 'done'

export interface BasicTask {
  id: string
  name: string
  group: string
  status: TaskStatus
  creationTimestamp: number
}

export interface AudioMeta {
  duration: number
}

export interface Transcript {
  id: string
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
}

export interface TranscribeResult {
  progress: number
  data: Transcript[]
}

export type IntelligenceStatus = 'processing' | 'done' | 'error'

export interface OutlineItem {
  id: string
  title: string
  timestamp: number
  level: 1 | 2 | 3
}

export interface OutlineState {
  status: IntelligenceStatus
  items?: OutlineItem[]
  error?: string
  generatedAt?: number
  model?: string
}

export interface SummaryState {
  status: IntelligenceStatus
  content?: string
  error?: string
  generatedAt?: number
  model?: string
}

export interface TranscribeTask extends BasicTask {
  type: 'transcribe'
  options: TranscribeOptions
  result: TranscribeResult | null
  outline?: OutlineState
  summary?: SummaryState
}

export interface TranslateOptions {
  targetLanguage: string
  model: string
  prompt: string
  batchSize: number
  batchConcurrency: number
}

export interface TranslateResult {
  progress: number
  data: Translation[]
}

export interface TranslateTask extends BasicTask {
  type: 'translate'
  parentTaskId: string
  sourceSnapshot: Transcript[]
  options: TranslateOptions
  result: TranslateResult | null
}

export type BasicTaskOptions = Omit<BasicTask, 'id' | 'status' | 'creationTimestamp'>

export type TranslateBasicTaskOptions = BasicTaskOptions & {
  parentTaskId: string
  sourceSnapshot: Transcript[]
}

export type Task = TranscribeTask | TranslateTask
