import { Task } from '@/types/tasks'
import { atom } from 'jotai'
import { db } from '.'
import { store } from '../store'
import { isServer } from '../utils/is-server'

export type TaskAtom<T extends Task> = ReturnType<typeof atomTask<T>>
export type TaskListAtom<T extends Task> = ReturnType<typeof atomTaskList<T>>

function atomTask<T extends Task>(initialTask: T) {
  const taskValueAtom = atom<T>(initialTask)
  const taskAtom = atom(
    (get) => get(taskValueAtom),
    (get, set, update: T | ((prev: T) => T)) => {
      const value =
        typeof update === 'function' ? update(get(taskAtom)) : update
      set(taskValueAtom, value)
      !isServer() && db!.tasks.put(value)
    },
  )

  return taskAtom
}

function atomTaskList<T extends Task>(initialTaskList: Array<TaskAtom<T>>) {
  return atom<Array<TaskAtom<T>>>(initialTaskList)
}

export function createTaskListAtomAndFetchFromDb<T extends Task>(
  taskType: T['type'],
) {
  const taskListAtom = atomTaskList<T>([])

  ;(async () => {
    if (isServer()) {
      return
    }

    const result = (await db!.tasks
      .where('type')
      .equals(taskType)
      .toArray()) as T[]
    store.set(
      taskListAtom,
      result.map((t) => atomTask<T>(t)),
    )
  })()

  return taskListAtom
}

export function createTaskAtomAndPutToDb<T extends Task>(task: T) {
  const taskAtom = atomTask<T>(task)

  ;(async () => {
    if (isServer()) {
      return
    }

    await db!.tasks.put(task)
  })()

  return taskAtom
}
