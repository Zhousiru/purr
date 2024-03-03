import { TranscribeTask, TranslateTask } from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { store } from '../store'
import { TaskProcessor } from './pool'
import { initTaskResult, isRecoveredTask } from './utils'

export const transcribeProcessor: TaskProcessor<TranscribeTask> = (
  taskAtom: PrimitiveAtom<TranscribeTask>,
) => {
  // FIXME: Fake processor.

  let abort: null | (() => void) = null

  const promise = new Promise<void>((resolve, reject) => {
    if (isRecoveredTask(taskAtom)) {
      // TODO: Support for recovering transcribing.
    }

    initTaskResult(taskAtom, {
      progress: 0,
      transcription: [],
    })

    const intervalId = setInterval(() => {
      store.set(taskAtom, (prev) => ({
        ...prev,
        result: {
          progress: prev.result!.progress + 10,
          transcription: [],
        },
      }))

      if (store.get(taskAtom).result!.progress === 100) {
        clearInterval(intervalId)
        resolve()
      }
    }, 500)

    abort = () => {
      clearInterval(intervalId)
      reject()
      return
    }
  })

  return {
    abort: abort!,
    promise,
  }
}

export const translateProcessor: TaskProcessor<TranslateTask> = (
  taskAtom: PrimitiveAtom<TranslateTask>,
) => {
  // FIXME: Fake processor.

  let abort: null | (() => void) = null

  const promise = new Promise<void>((resolve, reject) => {
    if (!isRecoveredTask(taskAtom)) {
      initTaskResult(taskAtom, {
        progress: 0,
        translation: [],
      })
    }

    const intervalId = setInterval(() => {
      store.set(taskAtom, (prev) => ({
        ...prev,
        result: {
          progress: prev.result!.progress + 10,
          translation: [],
        },
      }))

      if (store.get(taskAtom).result!.progress === 100) {
        clearInterval(intervalId)
        resolve()
      }
    }, 500)

    abort = () => {
      clearInterval(intervalId)
      reject()
      return
    }
  })

  return {
    abort: abort!,
    promise,
  }
}
