import { transcribeTaskListAtom } from '@/atoms/tasks'
import {
  BasicTaskOptions,
  Task,
  TranscribeOptions,
  TranslateOptions,
} from '@/types/tasks'
import { TaskPool } from './pool'
import { transcribeProcessor } from './processor'

// TODO: Custom max concurrency.
const maxTranscribe = 2
const maxTranslate = 2

const transcribePool = new TaskPool(
  transcribeTaskListAtom,
  transcribeProcessor,
  maxTranscribe,
)

// TODO: Init translate pool.
// const translatePool = new TaskPool(
//   translateTaskListAtom
//   translateProcessor,
//   maxTranslate,
// )

export function addTask(
  type: 'transcribe',
  basicOptions: BasicTaskOptions,
  options: TranscribeOptions,
): void
export function addTask(
  type: 'translate',
  basicOptions: BasicTaskOptions,
  options: TranslateOptions,
): void
export function addTask<T extends Task>(
  type: T['type'],
  basicOptions: BasicTaskOptions,
  options: T['options'],
): void {
  switch (type) {
    case 'transcribe':
      transcribePool.addTask({
        type,
        ...basicOptions,
        options: options as TranscribeOptions,
        status: 'queued',
        result: null,
      })
      break

    case 'translate':
      // TODO: Add to translate pool.
      break
  }
}
