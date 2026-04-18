import { cardOverscanHeight, resolution } from '@/constants/editor'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { createIsPlayingAtom } from '@/lib/player/atoms'
import { store } from '@/lib/store'
import { Task, Transcript, TranslateTask } from '@/types/tasks'
import { atom, useAtom, useAtomValue } from 'jotai'
import { Getter } from 'jotai/vanilla'
import { transcribeTaskListAtom, translateTaskListAtom } from './tasks'

export const ZOOM_LEVELS = [0.5, 1, 2, 4, 8, 16] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]

const currentEditingTaskAtom = atom<TaskAtom<Task> | null>(null)
export const setCurrentEditingTaskAtom = (taskAtom: TaskAtom<Task> | null) =>
  store.set(currentEditingTaskAtom, taskAtom)
export const useCurrentEditingTaskAtomValue = () =>
  useAtomValue(currentEditingTaskAtom)

export function findTaskAtomById(id: string): TaskAtom<Task> | null {
  const allLists = [
    store.get(transcribeTaskListAtom),
    store.get(translateTaskListAtom),
  ] as TaskAtom<Task>[][]

  for (const list of allLists) {
    const found = list.find((a) => store.get(a).id === id)
    if (found) return found as TaskAtom<Task>
  }
  return null
}

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

const waveformViewportHeight = atom(0)
export const useWaveformViewportHeightValue = () =>
  useAtomValue(waveformViewportHeight)
export const setWaveformViewportHeight = (height: number) =>
  store.set(waveformViewportHeight, height)
export const getWaveformViewportHeight = () => store.get(waveformViewportHeight)
export const subWaveformViewportHeight = (callback: () => void) =>
  store.sub(waveformViewportHeight, callback)

// Dynamic margin
const marginBlockAtom = atom((get) => get(waveformViewportHeight) / 2)
export const getMarginBlock = () => store.get(marginBlockAtom)
export const subMarginBlock = (callback: () => void) =>
  store.sub(marginBlockAtom, callback)

const waveformVisibleArea = atom({
  startY: -1,
  endY: -1,
})
export const setWaveformVisibleArea = (startY: number, endY: number) =>
  store.set(waveformVisibleArea, { startY, endY })
export const useWaveformVisibleAreaValue = () =>
  useAtomValue(waveformVisibleArea)

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

  const parentTaskId = (task as TranslateTask).parentTaskId
  const parentTaskAtom = get(transcribeTaskListAtom).find(
    (ta) => store.get(ta).id === parentTaskId,
  )
  if (!parentTaskAtom) {
    throw new Error('Invalid `parentTaskId`.')
  }

  return get(parentTaskAtom)
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
export const getCurrentEditingAudioDuration = () =>
  store.get(currentEditingAudioDurationAtom)

const currentEditingTaskNameAtom = atom((get) => {
  const taskAtom = get(currentEditingTaskAtom)
  if (!taskAtom) return ''
  return get(taskAtom).name
})
export const useCurrentEditingTaskNameValue = () =>
  useAtomValue(currentEditingTaskNameAtom)

const currentEditingLanguageAtom = atom(
  (get) => findTranscribeTask(get).options.language,
)
export const useCurrentEditingLanguageValue = () =>
  useAtomValue(currentEditingLanguageAtom)

const addMarkContext = atom<{
  startHeight: number
} | null>(null)
export const useAddMarkContext = () => useAtom(addMarkContext)
export const useAddMarkContextValue = () => useAtomValue(addMarkContext)
export const getAddMarkContext = () => store.get(addMarkContext)

const isFollowModeAtom = atom(false)
export const useIsFollowMode = () => useAtom(isFollowModeAtom)
export const useIsFollowModeValue = () => useAtomValue(isFollowModeAtom)
export const getIsFollowMode = () => store.get(isFollowModeAtom)

const zoomLevelAtom = atom<ZoomLevel>(1)
export const useZoomLevel = () => useAtom(zoomLevelAtom)
export const useZoomLevelValue = () => useAtomValue(zoomLevelAtom)
export const getZoomLevel = () => store.get(zoomLevelAtom)
export const setZoomLevel = (level: ZoomLevel) =>
  store.set(zoomLevelAtom, level)
export const subZoomLevel = (callback: () => void) =>
  store.sub(zoomLevelAtom, callback)

const effectiveResolutionAtom = atom((get) =>
  Math.round(resolution * get(zoomLevelAtom)),
)
export const getEffectiveResolution = () => store.get(effectiveResolutionAtom)

export type CardPosition = {
  id: string
  top: number
  height: number
}

const cardPositionsAtom = atom<CardPosition[]>((get) => {
  const taskAtom = get(currentEditingTaskAtom)
  if (!taskAtom) return []
  const data = get(taskAtom).result?.data
  if (!data) return []
  const marginBlock = get(marginBlockAtom)
  const effRes = get(effectiveResolutionAtom)
  const dpr = window.devicePixelRatio
  return data.map((d) => {
    const top = marginBlock + (d.start * effRes) / dpr
    const bottom = marginBlock + (d.end * effRes) / dpr
    return { id: d.id, top, height: bottom - top }
  })
})
export const useCardPositionsValue = () => useAtomValue(cardPositionsAtom)
export const getCardPositions = () => store.get(cardPositionsAtom)

const visibleCardPositionsAtom = atom((get) => {
  const positions = get(cardPositionsAtom)
  const area = get(waveformVisibleArea)
  const start = area.startY - cardOverscanHeight
  const end = area.endY + cardOverscanHeight
  return positions.filter((c) => c.top + c.height >= start && c.top <= end)
})
export const useVisibleCardPositionsValue = () =>
  useAtomValue(visibleCardPositionsAtom)

const totalHeightAtom = atom((get) => {
  const duration = get(currentEditingAudioDurationAtom)
  const marginBlock = get(marginBlockAtom)
  const effRes = get(effectiveResolutionAtom)
  return marginBlock * 2 + (duration * effRes) / window.devicePixelRatio
})
export const useTotalHeightValue = () => useAtomValue(totalHeightAtom)

// Derived Map for O(1) subtitle lookup by UUID.
const dataMapAtom = atom<ReadonlyMap<string, Transcript>>((get) => {
  const taskAtom = get(currentEditingTaskAtom)
  if (!taskAtom) return new Map()
  const data = get(taskAtom).result?.data
  if (!data) return new Map()
  return new Map(data.map((d) => [d.id, d]))
})
export const useDataMapValue = () => useAtomValue(dataMapAtom)
export const getDataMap = () => store.get(dataMapAtom)

// Waveform column width — set by WaveformCanvas ResizeObserver, used by
// BoundaryHandles to position handles at the separator line.
const waveformColumnWidthAtom = atom(0)
export const useWaveformColumnWidthValue = () =>
  useAtomValue(waveformColumnWidthAtom)
export const setWaveformColumnWidth = (width: number) =>
  store.set(waveformColumnWidthAtom, width)

// Imperative task setter for use outside React (e.g. drag handlers).
export const setCurrentEditingTask = (
  updater: (prev: Task) => Task,
) => {
  const taskAtom = store.get(currentEditingTaskAtom)
  if (!taskAtom) {
    throw new Error('Current editing task atom cannot be `null`.')
  }
  store.set(taskAtom, updater)
}

// Y position of the outer expansion limit during a boundary drag, or -1 when idle.
const dragLimitYAtom = atom(-1)
export const useDragLimitYValue = () => useAtomValue(dragLimitYAtom)
export const setDragLimitY = (y: number) => store.set(dragLimitYAtom, y)

// Subtitle UUID currently being dragged, or null.
const draggingRowIdAtom = atom<string | null>(null)
export const useDraggingRowIdValue = () => useAtomValue(draggingRowIdAtom)
export const setDraggingRowId = (id: string | null) =>
  store.set(draggingRowIdAtom, id)

// Subtitle UUID whose move-drag position is invalid (overlaps), or null.
const dragInvalidIdAtom = atom<string | null>(null)
export const useDragInvalidIdValue = () => useAtomValue(dragInvalidIdAtom)
export const setDragInvalidId = (id: string | null) =>
  store.set(dragInvalidIdAtom, id)

// Subtitle UUID hovered by pointer Y (shared across waveform / cards / gaps).
const hoveredRowIdAtom = atom<string | null>(null)
export const useHoveredRowIdValue = () => useAtomValue(hoveredRowIdAtom)
export const getHoveredRowId = () => store.get(hoveredRowIdAtom)
export const setHoveredRowId = (id: string | null) =>
  store.set(hoveredRowIdAtom, id)

// Highlighted subtitle UUIDs (focus, playback follow, drag, etc.).
const highlightedRowIdsAtom = atom<string[]>([])
export const useHighlightedRowIdsValue = () => useAtomValue(highlightedRowIdsAtom)
export const setHighlightedRowIds = (ids: string[]) =>
  store.set(highlightedRowIdsAtom, ids)

// Hit-test a Y coordinate (in scroll-content space) against card positions.
// Returns null when the pointer lands in a gap or outside every row.
export function findRowIdByY(y: number): string | null {
  const positions = store.get(cardPositionsAtom)
  for (const p of positions) {
    if (y >= p.top && y <= p.top + p.height) {
      return p.id
    }
  }
  return null
}
