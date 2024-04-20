import { TaskAtom } from '@/lib/db/task-atom-storage'
import { createIsPlayingAtom } from '@/lib/player/atoms'
import { store } from '@/lib/store'
import { Task } from '@/types/tasks'
import { atom, useAtom, useAtomValue } from 'jotai'
import { Getter } from 'jotai/vanilla'
import { transcribeTaskListAtom } from './tasks'

const currentEditingTaskAtom = atom<TaskAtom<Task> | null>(null)
export const setCurrentEditingTaskAtom = (taskAtom: TaskAtom<Task> | null) =>
  store.set(currentEditingTaskAtom, taskAtom)
export const useCurrentEditingTaskAtomValue = () =>
  useAtomValue(currentEditingTaskAtom)
export const useCurrentEditingTask = () => {
  const taskAtom = useCurrentEditingTaskAtomValue()
  if (!taskAtom) {
    throw new Error('Current editing task atom cannot be `null`.')
  }
  return useAtom(taskAtom)
}
export const useCurrentEditingTaskValue = () => {
  const taskAtom = useCurrentEditingTaskAtomValue()
  if (!taskAtom) {
    throw new Error('Current editing task atom cannot be `null`.')
  }
  return useAtomValue(taskAtom)
}

const isPlayingAtom = createIsPlayingAtom()
export const useIsPlayingValue = () => useAtomValue(isPlayingAtom)

const findTranscribeTask = (get: Getter) => {
  const taskAtom = get(currentEditingTaskAtom)
  if (!taskAtom) {
    throw new Error('Current editing task atom cannot be `null`.')
  }
  const task = get(taskAtom)

  if (task.type === 'transcribe') {
    return task
  }

  const relatedTaskAtom = get(transcribeTaskListAtom).find(
    (taskAtom) => store.get(taskAtom).name === task.relatedTaskName,
  )
  if (!relatedTaskAtom) {
    throw new Error('Invalid `relatedTaskName`.')
  }

  return get(relatedTaskAtom)
}

const currentEditingAudioPathAtom = atom(
  (get) => findTranscribeTask(get).options.sourcePath,
)
export const useCurrentEditingAudioPathValue = () =>
  useAtomValue(currentEditingAudioPathAtom)

const currentEditingAudioDurationAtom = atom(
  (get) => findTranscribeTask(get).options.sourceMeta.duration,
)
export const useCurrentEditingAudioDurationValue = () =>
  useAtomValue(currentEditingAudioDurationAtom)

const addMarkContext = atom<{
  startHeight: number
} | null>(null)
export const useAddMarkContext = () => useAtom(addMarkContext)
export const useAddMarkContextValue = () => useAtomValue(addMarkContext)

const currentHighlightIndex = atom<number>(-1)
export const setCurrentHighlightIndex = (index: number) =>
  store.set(currentHighlightIndex, index)
export const useCurrentHighlightIndexValue = () =>
  useAtomValue(currentHighlightIndex)
