import { store } from '@/lib/store'
import { atom, useAtomValue } from 'jotai'

/**
 * Per-transcribe-task view state for the editor's translation list.
 * `viewed[]` includes the transcribe task id itself when "Original" is shown.
 * `flagged` is the variation that drives the floating subtitle viewer and
 * the compact text-card view; it must always be a member of `viewed`.
 *
 * Session-only — not persisted. Every app reload starts with only "Original"
 * viewed and flagged for each transcribe task.
 */
export interface ViewState {
  viewed: string[]
  flagged: string
}

type ViewMap = Record<string, ViewState>

export const viewedVariationsAtom = atom<ViewMap>({})

export const useViewedVariations = () => useAtomValue(viewedVariationsAtom)

function defaultState(transcribeId: string): ViewState {
  return { viewed: [transcribeId], flagged: transcribeId }
}

export function getViewState(transcribeId: string): ViewState {
  const map = store.get(viewedVariationsAtom)
  return map[transcribeId] ?? defaultState(transcribeId)
}

export function useViewState(transcribeId: string | null): ViewState | null {
  const map = useAtomValue(viewedVariationsAtom)
  if (!transcribeId) return null
  return map[transcribeId] ?? defaultState(transcribeId)
}

function update(transcribeId: string, fn: (s: ViewState) => ViewState) {
  store.set(viewedVariationsAtom, (prev) => {
    const cur = prev[transcribeId] ?? defaultState(transcribeId)
    return { ...prev, [transcribeId]: fn(cur) }
  })
}

export function toggleViewed(transcribeId: string, taskId: string) {
  update(transcribeId, (cur) => {
    if (cur.viewed.includes(taskId)) {
      const viewed = cur.viewed.filter((id) => id !== taskId)
      // Always keep at least one variation visible; fall back to Original.
      if (viewed.length === 0) viewed.push(transcribeId)
      const flagged = viewed.includes(cur.flagged) ? cur.flagged : viewed[0]
      return { viewed, flagged }
    }
    return { ...cur, viewed: [...cur.viewed, taskId] }
  })
}

export function setFlagged(transcribeId: string, taskId: string) {
  update(transcribeId, (cur) => {
    const viewed = cur.viewed.includes(taskId)
      ? cur.viewed
      : [...cur.viewed, taskId]
    return { viewed, flagged: taskId }
  })
}

/** Add a task to the viewed set and flag it as primary. */
export function ensureViewedAndFlag(transcribeId: string, taskId: string) {
  setFlagged(transcribeId, taskId)
}

/** Remove a variation entirely from the view state (e.g. after delete). */
export function pruneVariation(transcribeId: string, taskId: string) {
  update(transcribeId, (cur) => {
    const viewed = cur.viewed.filter((id) => id !== taskId)
    if (viewed.length === 0) viewed.push(transcribeId)
    const flagged = viewed.includes(cur.flagged) ? cur.flagged : viewed[0]
    return { viewed, flagged }
  })
}
