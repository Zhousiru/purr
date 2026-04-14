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
  /** 0..1 when known, undefined for indeterminate. */
  progress?: number
  lastUpdated: number
}

export type NotificationEvent =
  | { kind: 'upsert'; notification: Notification }
  | { kind: 'remove'; id: string }

// atomFamily gives each notification its own atom so a content component
// subscribes only to the id it renders — progress updates don't re-render
// the other toasts.
const notificationAtom = atomFamily((_id: string) =>
  atom<Notification | undefined>(undefined),
)

export const useNotification = (id: string) =>
  useAtomValue(notificationAtom(id))

const autoDismissTimers = new Map<string, number>()

// Terminal-state dismiss timeouts in ms. `progress` is omitted — progress
// toasts stay until they transition or are explicitly removed.
const DISMISS_MS: Partial<Record<NotificationType, number>> = {
  success: 4000,
  error: 6000,
  info: 4000,
}

export function upsertNotification(input: Omit<Notification, 'lastUpdated'>) {
  const n: Notification = { ...input, lastUpdated: Date.now() }
  const a = notificationAtom(n.id)
  const existed = store.get(a) !== undefined

  store.set(a, n)

  if (!existed) {
    toast.custom(() => <NotificationContent id={n.id} />, {
      id: n.id,
      duration: Infinity,
      position: 'bottom-right',
    })
  }

  const existing = autoDismissTimers.get(n.id)
  if (existing !== undefined) {
    clearTimeout(existing)
    autoDismissTimers.delete(n.id)
  }
  const delay = DISMISS_MS[n.type]
  if (delay !== undefined) {
    const timer = window.setTimeout(() => removeNotification(n.id), delay)
    autoDismissTimers.set(n.id, timer)
  }
}

export function removeNotification(id: string) {
  const timer = autoDismissTimers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    autoDismissTimers.delete(id)
  }
  store.set(notificationAtom(id), undefined)
  notificationAtom.remove(id)
  toast.dismiss(id)
}

export function applyNotificationEvent(event: NotificationEvent) {
  if (event.kind === 'upsert') {
    const { lastUpdated: _lu, ...rest } = event.notification
    upsertNotification(rest)
  } else {
    removeNotification(event.id)
  }
}
