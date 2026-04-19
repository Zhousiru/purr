import { Task } from '@/types/tasks'
import { atom } from 'jotai'
import { db } from '.'
import { store } from '../store'

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
      db.tasks.put(value)
    },
  )

  return taskAtom
}

function atomTaskList<T extends Task>(initialTaskList: Array<TaskAtom<T>>) {
  return atom<Array<TaskAtom<T>>>(initialTaskList)
}

export function createTaskListAtomWithDb<T extends Task>(taskType: T['type']) {
  const taskListAtom = atomTaskList<T>([])

  ;(async () => {
    const result = (await db.tasks
      .where('type')
      .equals(taskType)
      .toArray()) as T[]

    // Rescue orphan tasks from an abrupt prior shutdown (crash / force-quit):
    // `processing` has no running processor to resume it, and `queued` cannot
    // be paused or resumed from the UI because the pool's stop-path ignores
    // that state. Flip both to `stopped` so the user can restart them.
    const orphans = result.filter(
      (t) => t.status === 'processing' || t.status === 'queued',
    )
    if (orphans.length > 0) {
      for (const t of orphans) {
        t.status = 'stopped'
      }
      await db.tasks.bulkPut(orphans)
      console.warn(
        `[task-manager] rescued ${orphans.length} orphan ${taskType} task(s) \u2192 stopped`,
      )
    }

    store.set(
      taskListAtom,
      result.map((t) => atomTask<T>(t)),
    )
  })()

  return taskListAtom
}

export function createTaskAtomWithDb<T extends Task>(task: T) {
  const taskAtom = atomTask<T>(task)

  ;(async () => {
    await db.tasks.put(task)
  })()

  return taskAtom
}

export function removeFromTaskListAtomWithDb<T extends Task>(
  taskListAtom: TaskListAtom<T>,
  taskId: string,
) {
  const taskList = store.get(taskListAtom)
  const taskAtom = taskList.find((a) => store.get(a).id === taskId)!

  store.set(
    taskListAtom,
    taskList.filter((a) => a !== taskAtom),
  )

  ;(async () => {
    await db.tasks.delete(taskId)
  })()
}
