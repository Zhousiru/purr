import { transcribeTaskListAtom, translateTaskListAtom } from '@/atoms/tasks'
import {
  BasicTaskOptions,
  Task,
  TranscribeOptions,
  TranslateOptions,
} from '@/types/tasks'
import { TaskPool } from './pool'
import { transcribeProcessor, translateProcessor } from './processor'

// TODO: Custom max concurrency.
const maxTranscribe = 1
const maxTranslate = 2

const transcribePool = new TaskPool(
  transcribeTaskListAtom,
  transcribeProcessor,
  maxTranscribe,
)

const translatePool = new TaskPool(
  translateTaskListAtom,
  translateProcessor,
  maxTranslate,
)

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
      translatePool.addTask({
        type,
        ...basicOptions,
        options: options as TranslateOptions,
        status: 'queued',
        result: null,
      })
      break
  }
}

export function stopTask(type: Task['type'], taskName: string) {
  switch (type) {
    case 'transcribe':
      transcribePool.stopTask(taskName)
      break

    case 'translate':
      translatePool.stopTask(taskName)
      break
  }
}

export function startTask(type: Task['type'], taskName: string) {
  switch (type) {
    case 'transcribe':
      transcribePool.startTask(taskName)
      break

    case 'translate':
      translatePool.startTask(taskName)
      break
  }
}
