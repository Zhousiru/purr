import { TranscribeOptions } from './tasks'

export interface NewTasks {
  files: string[]
  group: string
  transcriptionOption: Omit<TranscribeOptions, 'sourcePath' | 'sourceMeta'>
  state: {
    createTranscription: boolean
    autoLanguage: boolean
  }
}
