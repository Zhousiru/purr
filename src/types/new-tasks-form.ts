import { TranscribeOptions, TranslateOptions } from './tasks'

export interface NewTasks {
  files: string[]
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
