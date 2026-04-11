import { TranscribeOptions } from './tasks'

export interface NewUrlTask {
  url: string
  group: string
  transcriptionOption: Omit<TranscribeOptions, 'sourcePath' | 'sourceMeta'>
  state: {
    createTranscription: boolean
    autoLanguage: boolean
  }
}
