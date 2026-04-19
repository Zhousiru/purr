import { llmProviderConfigAtom } from '@/atoms/llm-provider'
import { upsertNotification } from '@/atoms/notifications'
import { getMonitor } from '@/atoms/whisper-server'
import { translate } from '@/lib/translator'
import { TranscribeTask, TranslateTask, Translation } from '@/types/tasks'
import { produce } from 'immer'
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
      cancelWhisperServerTask(task.id)
      reject()
    }

    if (isRecoveredTask(taskAtom)) {
      // TODO: Support for recovering transcribing.
    }

    initTaskResult(taskAtom, {
      progress: 0,
      data: [],
    })

    const task = store.get(taskAtom)
    const monitor = getMonitor()

    await addWhisperServerTask(task.id, task.options.sourcePath, {
      lang: task.options.language,
      prompt: task.options.prompt,
      vad: task.options.vadFilter,
    })

    try {
      for await (const event of monitor.watch(task.id)) {
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
    } catch (error) {
      // Whisper server connection is closed unexpectedly.
      reject(error)
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
  const controller = new AbortController()

  const abort = () => {
    controller.abort()
  }

  const promise = (async () => {
    if (!isRecoveredTask(taskAtom)) {
      initTaskResult(taskAtom, { progress: 0, data: [] })
    }

    const task = store.get(taskAtom)
    const source = task.sourceSnapshot
    const total = source.length

    if (total === 0) {
      updateTaskProgress(taskAtom, 100)
      return
    }

    const existing = task.result?.data ?? []
    const doneIds = new Set(existing.map((t) => t.id))
    const remaining = source.filter((s) => !doneIds.has(s.id))
    const doneBefore = existing.length

    if (remaining.length === 0) {
      updateTaskProgress(taskAtom, 100)
      return
    }

    const config = store.get(llmProviderConfigAtom)

    const startedAt = performance.now()
    console.log(
      `[translate] start "${task.name}" provider=${config.provider} model=${task.options.model} lang=${task.options.targetLanguage} total=${total} remaining=${remaining.length} batchSize=${task.options.batchSize} concurrency=${task.options.batchConcurrency}`,
    )

    try {
      await translate(
        remaining,
        task.options,
        config,
        {
          onLine: (t: Translation) => {
            store.set(taskAtom, (prev) =>
              produce(prev, (draft) => {
                if (!draft.result) {
                  draft.result = { progress: 0, data: [] }
                }
                const idx = draft.result.data.findIndex((d) => d.id === t.id)
                if (idx >= 0) {
                  draft.result.data[idx] = t
                } else {
                  draft.result.data.push(t)
                }
              }),
            )
          },
          onProgress: (ratio) => {
            const thisRun = Math.round(ratio * remaining.length)
            const overall = ((doneBefore + thisRun) / total) * 100
            updateTaskProgress(taskAtom, overall)
          },
        },
        controller.signal,
      )
    } catch (err) {
      if (controller.signal.aborted) {
        console.log(`[translate] aborted "${task.name}"`)
        throw err
      }
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[translate] failed "${task.name}":`, message)
      upsertNotification({
        id: `task-error-${task.id}`,
        type: 'error',
        title: 'Translation failed',
        desc: `${task.name}: ${message}`,
      })
      throw err
    }

    const elapsedMs = Math.round(performance.now() - startedAt)
    console.log(`[translate] done "${task.name}" in ${elapsedMs}ms`)
  })()

  return {
    abort,
    promise,
  }
}
