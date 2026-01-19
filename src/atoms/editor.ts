import { TaskAtom } from '@/lib/db/task-atom-storage'
import { createIsPlayingAtom } from '@/lib/player/atoms'
import { store } from '@/lib/store'
import { Task } from '@/types/tasks'
import { atom, useAtom, useAtomValue } from 'jotai'
import { Getter } from 'jotai/vanilla'
import { transcribeTaskListAtom } from './tasks'
import { resolution } from '@/constants/editor'

export const ZOOM_LEVELS = [0.5, 1, 2, 4, 8, 16] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]

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
export const getCurrentEditingTask = () => {
  const taskAtom = store.get(currentEditingTaskAtom)
  if (!taskAtom) {
    throw new Error('Current editing task atom cannot be `null`.')
  }
  return store.get(taskAtom)
}

const waveformViewportHeight = atom(-1)
export const useWaveformViewportHeightValue = () =>
  useAtomValue(waveformViewportHeight)
export const setWaveformViewportHeight = (height: number) =>
  store.set(waveformViewportHeight, height)
export const getWaveformViewportHeight = () => store.get(waveformViewportHeight)

const waveformVisibleArea = atom({
  startY: -1,
  endY: -1,
})
export const useWaveformVisibleAreaValue = () =>
  useAtomValue(waveformVisibleArea)
export const setWaveformVisibleArea = (startY: number, endY: number) =>
  store.set(waveformVisibleArea, { startY, endY })
export const getWaveformVisibleArea = () => store.get(waveformVisibleArea)

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

const isFollowModeAtom = atom(false)
export const useIsFollowMode = () => useAtom(isFollowModeAtom)
export const useIsFollowModeValue = () => useAtomValue(isFollowModeAtom)

const zoomLevelAtom = atom<ZoomLevel>(1)
export const useZoomLevel = () => useAtom(zoomLevelAtom)
export const useZoomLevelValue = () => useAtomValue(zoomLevelAtom)
export const getZoomLevel = () => store.get(zoomLevelAtom)
export const setZoomLevel = (level: ZoomLevel) => store.set(zoomLevelAtom, level)
export const subZoomLevel = (callback: () => void) => store.sub(zoomLevelAtom, callback)

const effectiveResolutionAtom = atom((get) => Math.round(resolution * get(zoomLevelAtom)))
export const useEffectiveResolution = () => useAtomValue(effectiveResolutionAtom)
export const getEffectiveResolution = () => store.get(effectiveResolutionAtom)
