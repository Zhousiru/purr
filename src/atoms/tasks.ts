import { TaskAtom, createTaskListAtomWithDb } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { Task, TranscribeTask, TranslateTask } from '@/types/tasks'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

export const transcribeTaskListAtom =
  createTaskListAtomWithDb<TranscribeTask>('transcribe')
export const translateTaskListAtom =
  createTaskListAtomWithDb<TranslateTask>('translate')

export const taskTypeFilterAtom = atom<'all' | Task['type']>('all')

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
    !result.includes(group) && result.push(group)
  })

  return result
})

export const taskListAtom = atom((get) => {
  let list: Array<TaskAtom<Task>> = []

  switch (get(taskTypeFilterAtom)) {
    case 'transcribe':
      list = get(transcribeTaskListAtom) as Array<TaskAtom<Task>>
      break

    case 'translate':
      list = get(translateTaskListAtom) as Array<TaskAtom<Task>>
      break

    case 'all':
      list = [
        ...get(transcribeTaskListAtom),
        ...get(translateTaskListAtom),
      ] as Array<TaskAtom<Task>>
      break
  }

  const groupFilter = get(guardedTaskGroupFilterAtom)

  if (groupFilter) {
    return list.filter((a) => get(selectTaskGroupAtom(a)) === groupFilter)
  }

  // `createdTimestamp` is designed to be unchangeable.
  // So, we use `store.get()` to avoid unnecessary recomputation.
  return list.sort(
    (a, b) => store.get(b).creationTimestamp - store.get(a).creationTimestamp,
  )
})
