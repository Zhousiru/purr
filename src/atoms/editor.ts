import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { Task } from '@/types/tasks'
import { atom, useAtom, useAtomValue } from 'jotai'
import { PrimitiveAtom } from 'jotai/vanilla'

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

const waveformScrollAtom = atom<number>(0)
export const setWaveformScroll = (top: number) =>
  store.set(waveformScrollAtom, top)

const contentScrollAtom = atom<number>(0)
export const setContentScroll = (top: number) =>
  store.set(contentScrollAtom, top)

const subScroll = (atom: PrimitiveAtom<number>, fn: (top: number) => void) =>
  store.sub(atom, () => {
    const value = store.get(atom)
    fn(value)
  })
export const subWaveformScroll = (fn: (top: number) => void) =>
  subScroll(waveformScrollAtom, fn)
export const subContentScroll = (fn: (top: number) => void) =>
  subScroll(contentScrollAtom, fn)

const currentAudioDurationAtom = atom<number>(0)
export const setCurrentAudioDuration = (duration: number) =>
  store.set(currentAudioDurationAtom, duration)
export const useCurrentAudioDurationValue = () =>
  useAtomValue(currentAudioDurationAtom)

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
