import { store } from '@/lib/store'
import { atom, useAtomValue } from 'jotai'

export type BinaryStatus =
  | { state: 'notInstalled' }
  | { state: 'installing'; progress?: number }
  | { state: 'installed'; version: string }
  | { state: 'checkingUpdate'; version: string }
  | { state: 'updating'; versionFrom: string; progress?: number }
  | { state: 'ready'; version: string; source: 'managed' | 'systemPath' }
  | { state: 'failed'; error: string; retryable: boolean }

export interface BinaryStatusEvent {
  id: string
  status: BinaryStatus
}

/** Binaries the "New Task from URL" flow requires. The ffmpeg spec provides
 * both ffmpeg and ffprobe, so we only track two ids. */
const REQUIRED: string[] = ['ffmpeg', 'yt-dlp']

export const binaryStatusesAtom = atom<Record<string, BinaryStatus>>({})

export const isMediaReadyAtom = atom((get) => {
  const map = get(binaryStatusesAtom)
  return REQUIRED.every((id) => map[id]?.state === 'ready')
})

export type MediaSetupPhase =
  | 'ready'
  | 'installing'
  | 'updating'
  | 'checking'
  | 'failed'
  | 'idle'

export interface MediaSetupSummary {
  phase: MediaSetupPhase
  progress?: number
  failedId?: string
  failedError?: string
}

// Aggregate snapshot across required binaries for the Launchpad card. Picks
// the "worst" state across the set: failed > in-progress > checking > ready.
export const mediaSetupSummaryAtom = atom<MediaSetupSummary>((get) => {
  const map = get(binaryStatusesAtom)
  const statuses = REQUIRED.map((id) => ({ id, status: map[id] }))

  for (const { id, status } of statuses) {
    if (status?.state === 'failed') {
      return {
        phase: 'failed',
        failedId: id,
        failedError: status.error,
      }
    }
  }

  for (const { status } of statuses) {
    if (status?.state === 'installing') {
      return { phase: 'installing', progress: status.progress }
    }
    if (status?.state === 'updating') {
      return { phase: 'updating', progress: status.progress }
    }
  }

  for (const { status } of statuses) {
    if (status?.state === 'checkingUpdate' || status?.state === 'installed') {
      return { phase: 'checking' }
    }
  }

  if (REQUIRED.every((id) => map[id]?.state === 'ready')) {
    return { phase: 'ready' }
  }

  return { phase: 'idle' }
})

export function setBinaryStatus(id: string, status: BinaryStatus) {
  const prev = store.get(binaryStatusesAtom)
  store.set(binaryStatusesAtom, { ...prev, [id]: status })
}

/** Merge-fill a snapshot from `get_binary_statuses`. Existing entries win
 * so a freshly-received event isn't clobbered by a stale snapshot. */
export function seedBinaryStatuses(map: Record<string, BinaryStatus>) {
  const prev = store.get(binaryStatusesAtom)
  store.set(binaryStatusesAtom, { ...map, ...prev })
}

export const useBinaryStatuses = () => useAtomValue(binaryStatusesAtom)
export const useIsMediaReady = () => useAtomValue(isMediaReadyAtom)
export const useMediaSetupSummary = () => useAtomValue(mediaSetupSummaryAtom)
