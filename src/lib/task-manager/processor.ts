import { getMonitor } from '@/atoms/whisper-server'
import { TranscribeTask, TranslateTask } from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { store } from '../store'
import {
  addWhisperServerTask,
  cancelWhisperServerTask,
} from '../whisper-server'
import { TaskProcessor } from './pool'
import {
  calcProgress,
  initTaskResult,
  isRecoveredTask,
  pushTaskTranscript,
  updateTaskProgress,
} from './utils'

export const transcribeProcessor: TaskProcessor<TranscribeTask> = (
  taskAtom: PrimitiveAtom<TranscribeTask>,
) => {
  let abort: null | (() => void) = null

  const promise = new Promise<void>(async (resolve, reject) => {
    abort = () => {
      cancelWhisperServerTask(task.name)
      reject()
    }

    if (isRecoveredTask(taskAtom)) {
      // TODO: Support for recovering transcribing.
    }

    initTaskResult(taskAtom, {
      progress: 0,
      transcript: [],
    })

    const task = store.get(taskAtom)
    const monitor = getMonitor()

    await addWhisperServerTask(task.name, task.options.sourcePath, {
      lang: task.options.language,
      prompt: task.options.prompt,
      vad: task.options.vadFilter,
    })

    for await (const event of monitor.watch(task.name)) {
      if (event.type === 'transcription') {
        const progress = calcProgress(
          event.data.end,
          task.options.sourceMeta.duration,
        )
        updateTaskProgress(taskAtom, progress)
        pushTaskTranscript(taskAtom, event.data)
      }

      if (event.type === 'language-detection') {
        store.set(taskAtom, (prev) => ({
          ...prev,
          options: {
            ...prev.options,
            language: event.data,
          },
        }))
      }

      if (event.type === 'status') {
        if (event.data === 'done') {
          updateTaskProgress(taskAtom, 100)
          resolve()
          break
        }

        if (event.data === 'canceled') {
          // `canceled` event is triggered by the `abort()`.
          // So, we don't need to `reject()` here.
          break
        }

        if (event.data === 'error') {
          reject()
          break
        }
      }
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
