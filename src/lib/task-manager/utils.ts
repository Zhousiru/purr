import { transcribeTaskListAtom } from '@/atoms/tasks'
import { DurationResult } from '@/types/commands'
import { NewTasks } from '@/types/new-tasks-form'
import {
  BasicTaskOptions,
  Task,
  TranscribeOptions,
  TranscribeTask,
  Transcript,
  TranslateTask,
  Translation,
} from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { addTask } from '.'
import { cmd } from '../commands'
import { store } from '../store'
import { NameGenerator } from './name-generator'

export function isRecoveredTask<T extends Task>(taskAtom: PrimitiveAtom<T>) {
  return store.get(taskAtom).result !== null
}

export function initTaskResult<T extends Task>(
  taskAtom: PrimitiveAtom<T>,
  result: NonNullable<T['result']>,
) {
  store.set(taskAtom, (prev) => ({
    ...prev,
    result,
  }))
}

export function updateTaskResult<T extends Task>(
  taskAtom: PrimitiveAtom<T>,
  result: (prev: T['result']) => NonNullable<T['result']>,
) {
  store.set(taskAtom, (prev) => ({
    ...prev,
    result: {
      ...result(prev.result),
    },
  }))
}

export function updateTaskProgress<T extends Task>(
  taskAtom: PrimitiveAtom<T>,
  progress: number,
) {
  updateTaskResult(taskAtom, (prev) => ({
    ...prev,
    progress,
  }))
}

export function pushTaskTranscript(
  taskAtom: PrimitiveAtom<TranscribeTask>,
  data: Transcript,
) {
  updateTaskResult(taskAtom, (prev) => {
    if (!prev) {
      throw new Error('Task result is null. Please initialize it first.')
    }
    return {
      ...prev!,
      data: [...prev!.data, data],
    }
  })
}

export function pushTaskTranslation(
  taskAtom: PrimitiveAtom<TranslateTask>,
  data: Translation,
) {
  updateTaskResult(taskAtom, (prev) => {
    if (!prev) {
      throw new Error('Task result is null. Please initialize it first.')
    }
    return {
      ...prev,
      data: [...prev.data, data],
    }
  })
}

export function calcProgress(current: number, total: number) {
  return (current / total) * 100
}

export function extractDurationResults(
  results: Array<DurationResult>,
  path: string,
) {
  const result = results.find((r) => r.path === path)
  return result?.duration ?? null
}

export async function addTasksFromForm(formData: NewTasks) {
  if (formData.state.createTranscription) {
    const nameGenerator = new NameGenerator(transcribeTaskListAtom)

    const durations = await cmd.getAudioDurations({ paths: formData.files })

    for (const file of formData.files) {
      const duration = extractDurationResults(durations, file)
      if (duration === null) {
        continue
      }

      const options: [BasicTaskOptions, TranscribeOptions] = [
        {
          group: formData.group,
          name: nameGenerator.generateName(file),
          relatedTaskName: null,
        },
        {
          sourcePath: file,
          sourceMeta: { duration },
          translateWith: formData.state.createTranslation
            ? formData.translationOption
            : null,
          ...formData.transcriptionOption,
        },
      ]

      // FIXME: Remove debug code.
      console.log(
        nameGenerator.generateName(file),
        '\n',
        options[0],
        '\n',
        options[1],
      )
      addTask('transcribe', ...options)
    }

    nameGenerator.dispose()
    return
  }

  if (formData.state.createTranslation) {
    // TODO: Add translation tasks.
  }
}
