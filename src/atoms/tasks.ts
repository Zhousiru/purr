import { Task, TranscribeTask, TranslateTask } from '@/types/tasks'
import { PrimitiveAtom, atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

export const transcribeTaskListAtom = atom<
  Array<PrimitiveAtom<TranscribeTask>>
>([])
export const translateTaskListAtom = atom<Array<PrimitiveAtom<TranslateTask>>>(
  [],
)

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

function selectTaskGroupAtom<T extends Task>(atom: PrimitiveAtom<T>) {
  return selectAtom(atom, (t) => t.group)
}

export const taskGroupsAtom = atom((get) => {
  const result: string[] = []
  const atoms = [
    ...get(transcribeTaskListAtom),
    ...get(translateTaskListAtom),
  ] as Array<PrimitiveAtom<Task>>

  atoms.forEach((a) => {
    const group = get(selectTaskGroupAtom(a))
    !result.includes(group) && result.push(group)
  })

  return result
})

// TODO: Sort the list.
export const taskListAtom = atom((get) => {
  let list: Array<PrimitiveAtom<Task>> = []

  switch (get(taskTypeFilterAtom)) {
    case 'transcribe':
      list = get(transcribeTaskListAtom) as Array<PrimitiveAtom<Task>>
      break

    case 'translate':
      list = get(translateTaskListAtom) as Array<PrimitiveAtom<Task>>
      break

    case 'all':
      list = [
        ...get(transcribeTaskListAtom),
        ...get(translateTaskListAtom),
      ] as Array<PrimitiveAtom<Task>>
      break
  }

  const groupFilter = get(guardedTaskGroupFilterAtom)

  if (groupFilter) {
    return list.filter((a) => get(selectTaskGroupAtom(a)) === groupFilter)
  }
  return list
})
