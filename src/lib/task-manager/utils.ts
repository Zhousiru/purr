import { transcribeTaskListAtom } from '@/atoms/tasks'
import { NewTasks } from '@/types/new-tasks-form'
import { BasicTaskOptions, Task, TranscribeOptions } from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { addTask } from '.'
import { TaskListAtom } from '../db/task-atom-storage'
import { store } from '../store'
import { getFilename } from '../utils/path'

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

export function generateTaskName<T extends Task>(
  paths: string[],
  taskListAtom: TaskListAtom<T>,
) {
  const existed = new Map<string, number>()
  const result = new Map<string, string>()

  for (const taskAtom of store.get(taskListAtom)) {
    const task = store.get(taskAtom)
    const originalName = task.name.replace(/ \(\d*\)$/, '')
    existed.set(originalName, (existed.get(originalName) ?? 0) + 1)
  }

  for (const path of paths) {
    const filename = getFilename(path)

    if (!existed.has(filename)) {
      existed.set(filename, 1)
      result.set(path, filename)
      continue
    }

    const count = existed.get(filename)!
    existed.set(filename, count + 1)
    result.set(path, `${filename} (${count})`)
  }

  return result
}

export function addTasksFromForm(formData: NewTasks) {
  if (formData.state.createTranscription) {
    const names = generateTaskName(formData.files, transcribeTaskListAtom)

    for (const file of formData.files) {
      const options: [BasicTaskOptions, TranscribeOptions] = [
        {
          group: formData.group,
          name: names.get(file)!,
        },
        {
          sourcePath: file,
          sourceMeta: { length: 0 }, // TODO: Get audio length.
          translateWith: formData.state.createTranslation
            ? formData.translationOption
            : null,
          ...formData.transcriptionOption,
        },
      ]
      // FIXME: Remove debug code.
      console.log(names.get(file)!, ...options)
      addTask('transcribe', ...options)
    }

    return
  }

  if (formData.state.createTranslation) {
    // TODO: Add translation tasks.
  }
}
