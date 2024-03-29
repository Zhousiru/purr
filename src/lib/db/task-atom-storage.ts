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

export function createTaskListAtomWithDb<T extends Task>(taskType: T['type']) {
  const taskListAtom = atomTaskList<T>([])

  if (!isServer()) {
    ;(async () => {
      const result = (await db!.tasks
        .where('type')
        .equals(taskType)
        .toArray()) as T[]
      store.set(
        taskListAtom,
        result.map((t) => atomTask<T>(t)),
      )
    })()
  }

  return taskListAtom
}

export function createTaskAtomWithDb<T extends Task>(task: T) {
  const taskAtom = atomTask<T>(task)

  if (!isServer()) {
    ;(async () => {
      await db!.tasks.put(task)
    })()
  }

  return taskAtom
}

export function removeFromTaskListAtomWithDb<T extends Task>(
  taskListAtom: TaskListAtom<T>,
  taskName: string,
) {
  const taskList = store.get(taskListAtom)
  const taskAtom = taskList.find((a) => store.get(a).name === taskName)!

  store.set(
    taskListAtom,
    taskList.filter((a) => a !== taskAtom),
  )

  const task = store.get(taskAtom)

  if (!isServer()) {
    ;(async () => {
      await db!.tasks.delete([task.type, task.name])
    })()
  }
}
