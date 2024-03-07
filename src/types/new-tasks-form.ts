import { TranscribeOptions, TranslateOptions } from './tasks'

export interface NewTasks {
  files: string[]
  transcribeOption: Omit<
    TranscribeOptions,
    'sourcePath' | 'sourceMeta' | 'translateWith'
  >
  translationOption: Omit<TranslateOptions, 'transcription'>
  state: {
    autoLanguage: boolean
    createTranslation: boolean
    translateOnly: boolean
  }
}
