'use client'

import { marginBlock } from '@/constants/waveform'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { Task } from '@/types/tasks'
import { atom, useAtom, useAtomValue } from 'jotai'

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

const waveformCanvasHeightAtom = atom<number>(0)
export const setWaveformCanvasHeight = (height: number) =>
  store.set(waveformCanvasHeightAtom, height)

const waveformHeightAtom = atom<number>(
  (get) => get(waveformCanvasHeightAtom) + marginBlock * 2,
)
export const useWaveformHeightValue = () => useAtomValue(waveformHeightAtom)

type EditorScrollTriggers = 'waveform' | 'timeline' | null

const editorScrollAtom = atom<[EditorScrollTriggers, number]>(['timeline', 0])
export const setEditorScroll = (setBy: EditorScrollTriggers, top: number) =>
  store.set(editorScrollAtom, [setBy, top])
export const subEditorScroll = (
  except: EditorScrollTriggers,
  fn: (top: number) => void,
) =>
  store.sub(editorScrollAtom, () => {
    const value = store.get(editorScrollAtom)
    if (value[0] === except) {
      return
    }
    fn(value[1])
  })

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
