import { TranscribeTask, TranslateTask } from '@/types/tasks'
import { PrimitiveAtom, atom } from 'jotai'

export const transcribeTaskListAtom = atom<
  Array<PrimitiveAtom<TranscribeTask>>
>([])
export const translateTaskListAtom = atom<Array<PrimitiveAtom<TranslateTask>>>(
  [],
)

// TODO: Sort the list.
export const taskListAtom = atom((get) => {
  return [...get(transcribeTaskListAtom), ...get(translateTaskListAtom)]
})
