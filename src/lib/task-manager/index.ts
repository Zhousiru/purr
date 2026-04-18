import { upsertNotification } from '@/atoms/notifications'
import { transcribeTaskListAtom, translateTaskListAtom } from '@/atoms/tasks'
import {
  BasicTaskOptions,
  Task,
  TranscribeOptions,
  TranslateBasicTaskOptions,
  TranslateOptions,
} from '@/types/tasks'
import { removeFromTaskListAtomWithDb } from '../db/task-atom-storage'
import { store } from '../store'
import { TaskPool } from './pool'
import { transcribeProcessor, translateProcessor } from './processor'

function taskKindLabel(type: Task['type']): string {
  return type === 'transcribe' ? 'Transcription' : 'Translation'
}

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
  basicOptions: TranslateBasicTaskOptions,
  options: TranslateOptions,
): void
export function addTask(
  type: Task['type'],
  basicOptions: BasicTaskOptions | TranslateBasicTaskOptions,
  options: TranscribeOptions | TranslateOptions,
): void {
  const id = crypto.randomUUID()

  switch (type) {
    case 'transcribe':
      transcribePool.addTask({
        id,
        type,
        ...basicOptions,
        options: options as TranscribeOptions,
        status: 'queued',
        creationTimestamp: Date.now(),
        result: null,
      })
      break

    case 'translate': {
      const translateBasicOptions = basicOptions as TranslateBasicTaskOptions
      translatePool.addTask({
        id,
        type,
        name: translateBasicOptions.name,
        group: translateBasicOptions.group,
        parentTaskId: translateBasicOptions.parentTaskId,
        sourceSnapshot: translateBasicOptions.sourceSnapshot,
        options: options as TranslateOptions,
        status: 'queued',
        creationTimestamp: Date.now(),
        result: null,
      })
      break
    }
  }

  upsertNotification({
    id: `task-create-${id}`,
    type: 'info',
    title: `${taskKindLabel(type)} queued`,
    desc: basicOptions.name,
    silent: true,
  })
}

export function stopTask(type: Task['type'], taskId: string) {
  switch (type) {
    case 'transcribe':
      transcribePool.stopTask(taskId)
      break

    case 'translate':
      translatePool.stopTask(taskId)
      break
  }
}

export function startTask(type: Task['type'], taskId: string) {
  switch (type) {
    case 'transcribe':
      transcribePool.startTask(taskId)
      break

    case 'translate':
      translatePool.startTask(taskId)
      break
  }
}

export function removeTask(type: Task['type'], taskId: string) {
  switch (type) {
    case 'transcribe':
      // Cascade delete child translate tasks
      const translateTasks = store.get(translateTaskListAtom)
      for (const ta of translateTasks) {
        const t = store.get(ta)
        if (t.parentTaskId === taskId) {
          translatePool.stopTask(t.id)
          removeFromTaskListAtomWithDb(translateTaskListAtom, t.id)
        }
      }
      removeFromTaskListAtomWithDb(transcribeTaskListAtom, taskId)
      break

    case 'translate':
      removeFromTaskListAtomWithDb(translateTaskListAtom, taskId)
      break
  }
}
