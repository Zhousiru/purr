import { TranscribeOptions, TranslateOptions } from './tasks'

export interface NewTasks {
  files: string[]
  group: string
  transcriptionOption: Omit<
    TranscribeOptions,
    'sourcePath' | 'sourceMeta' | 'translateWith'
  >
  translationOption: Omit<TranslateOptions, 'transcription'>
  state: {
    createTranscription: boolean
    createTranslation: boolean
    autoLanguage: boolean
  }
}
