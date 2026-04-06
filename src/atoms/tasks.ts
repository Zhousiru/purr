import { TaskAtom, createTaskListAtomWithDb } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { Task, TranscribeTask, TranslateTask } from '@/types/tasks'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

export const transcribeTaskListAtom =
  createTaskListAtomWithDb<TranscribeTask>('transcribe')
export const translateTaskListAtom =
  createTaskListAtomWithDb<TranslateTask>('translate')

const taskGroupFilterAtom = atom<string>('')
export const guardedTaskGroupFilterAtom = atom(
  (get) => {
    const raw = get(taskGroupFilterAtom)
    return get(taskGroupsAtom).includes(raw) ? raw : ''
  },
  (get, set, newValue: string) => {
    if (get(taskGroupsAtom).includes(newValue) || !newValue) {
      set(taskGroupFilterAtom, newValue)
    }
  },
)

function selectTaskGroupAtom<T extends Task>(atom: TaskAtom<T>) {
  return selectAtom(atom, (t) => t.group)
}

export const taskGroupsAtom = atom((get) => {
  const result: string[] = []
  const atoms = [
    ...get(transcribeTaskListAtom),
    ...get(translateTaskListAtom),
  ] as Array<TaskAtom<Task>>

  atoms.forEach((a) => {
    const group = get(selectTaskGroupAtom(a))
    if (!result.includes(group)) {
      result.push(group)
    }
  })

  return result
})

export const taskListAtom = atom((get) => {
  let list: Array<TaskAtom<Task>> = [
    ...get(transcribeTaskListAtom),
    ...get(translateTaskListAtom),
  ] as Array<TaskAtom<Task>>

  const groupFilter = get(guardedTaskGroupFilterAtom)

  if (groupFilter) {
    list = list.filter((a) => get(selectTaskGroupAtom(a)) === groupFilter)
  }

  // `createdTimestamp` is designed to be unchangeable.
  // So, we use `store.get()` to avoid unnecessary recomputation.
  return list.sort(
    (a, b) => store.get(b).creationTimestamp - store.get(a).creationTimestamp,
  )
})
