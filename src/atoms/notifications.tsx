import { NotificationContent } from '@/components/common/notifications'
import { store } from '@/lib/store'
import { atom, useAtomValue } from 'jotai'
import { atomFamily } from 'jotai-family'
import toast from 'react-hot-toast'

export type NotificationType = 'progress' | 'success' | 'error' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  desc?: string
  /** 0..1 known, undefined indeterminate. */
  progress?: number
  /** Skip the toast; only log on the notifications page. Silent entries
   * also never auto-dismiss. */
  silent?: boolean
  lastUpdated: number
}

export interface NotificationPatch {
  id: string
  type?: NotificationType
  desc?: string
  progress?: number
}

export type NotificationEvent =
  | { kind: 'upsert'; notification: Notification }
  | { kind: 'patch'; patch: NotificationPatch }
  | { kind: 'remove'; id: string }

// Per-id atom so progress ticks only re-render the row that changed.
const notificationAtom = atomFamily((_id: string) =>
  atom<Notification | undefined>(undefined),
)

// Insertion-ordered ids, for the page list. Updates here only fire on
// add/remove — per-id atoms drive content updates.
const notificationIdsAtom = atom<string[]>([])

export const useNotification = (id: string) =>
  useAtomValue(notificationAtom(id))

export const useNotificationIds = () => useAtomValue(notificationIdsAtom)

const autoDismissTimers = new Map<string, number>()

// Toast auto-dismiss windows. `progress` omitted — it stays until it
// transitions or is removed.
const DISMISS_MS: Partial<Record<NotificationType, number>> = {
  success: 4000,
  error: 6000,
  info: 4000,
}

function clearAutoDismiss(id: string) {
  const timer = autoDismissTimers.get(id)
  if (timer === undefined) return
  clearTimeout(timer)
  autoDismissTimers.delete(id)
}

export function upsertNotification(input: Omit<Notification, 'lastUpdated'>) {
  const n: Notification = { ...input, lastUpdated: Date.now() }
  const a = notificationAtom(n.id)
  const existed = store.get(a) !== undefined

  store.set(a, n)

  if (!existed) {
    store.set(notificationIdsAtom, (prev) => [...prev, n.id])
    if (!n.silent) {
      toast.custom(() => <NotificationContent id={n.id} />, {
        id: n.id,
        duration: Infinity,
        position: 'bottom-right',
      })
    }
  }

  clearAutoDismiss(n.id)
  const delay = n.silent ? undefined : DISMISS_MS[n.type]
  if (delay !== undefined) {
    // Hide the toast only; the page entry persists as session log.
    const timer = window.setTimeout(() => {
      toast.dismiss(n.id)
      autoDismissTimers.delete(n.id)
    }, delay)
    autoDismissTimers.set(n.id, timer)
  }
}

export function patchNotification(p: NotificationPatch) {
  const existing = store.get(notificationAtom(p.id))
  if (!existing) return
  const next: Notification = { ...existing }
  if (p.type !== undefined) next.type = p.type
  if (p.desc !== undefined) next.desc = p.desc
  if (p.progress !== undefined) next.progress = p.progress
  upsertNotification(next)
}

export function removeNotification(id: string) {
  clearAutoDismiss(id)
  store.set(notificationAtom(id), undefined)
  notificationAtom.remove(id)
  store.set(notificationIdsAtom, (prev) => prev.filter((x) => x !== id))
  toast.dismiss(id)
}

export function applyNotificationEvent(event: NotificationEvent) {
  switch (event.kind) {
    case 'upsert':
      upsertNotification(event.notification)
      break
    case 'patch':
      patchNotification(event.patch)
      break
    case 'remove':
      removeNotification(event.id)
      break
  }
}

/** Boot hydration — applies `getInitialNotifications`. Recovers
 * backend-emitted entries that fired before the listener attached. */
export function seedNotifications(items: Notification[]) {
  for (const item of items) {
    if (store.get(notificationAtom(item.id)) !== undefined) continue
    upsertNotification(item)
  }
}
