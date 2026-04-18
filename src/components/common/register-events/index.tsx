import { seedBinaryStatuses } from '@/atoms/bin-status'
import { seedNotifications } from '@/atoms/notifications'
import { cmd } from '@/lib/commands'
import { registerEvents } from '@/lib/events'
import { useEffect } from 'react'

export function RegisterEvents() {
  useEffect(() => {
    const unlisten = registerEvents()
    // Listeners attach before snapshots so live events between attach and
    // snapshot-return aren't lost; seed* dedupes against existing state.
    cmd
      .getBinaryStatuses()
      .then(seedBinaryStatuses)
      .catch((e) => console.error('[bin-status] snapshot failed', e))
    // One-shot boot replay; live updates flow over 'app://notification'.
    cmd
      .getInitialNotifications()
      .then(seedNotifications)
      .catch((e) => console.error('[notifications] initial fetch failed', e))
    return unlisten
  }, [])
  return null
}
