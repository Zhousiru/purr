import { TranslateOptions } from '@/types/tasks'

export const DEFAULT_TRANSLATE_OPTIONS: TranslateOptions = {
  targetLanguage: 'English',
  model: '',
  prompt: '',
  batchSize: 40,
  batchConcurrency: 1,
}

export const MIN_BATCH_SIZE = 5
export const MAX_BATCH_SIZE = 200
export const MIN_BATCH_CONCURRENCY = 1
export const MAX_BATCH_CONCURRENCY = 8
