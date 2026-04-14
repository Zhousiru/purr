import { seedBinaryStatuses } from '@/atoms/bin-status'
import { cmd } from '@/lib/commands'
import { registerEvents } from '@/lib/events'
import { useEffect } from 'react'

export function RegisterEvents() {
  useEffect(() => {
    const unlisten = registerEvents()
    // Seed status atoms with the current snapshot. Listeners are registered
    // first so any event fired between listen and snapshot-return wins over
    // the (potentially older) snapshot — seedBinaryStatuses merge-fills
    // rather than overwrites.
    cmd
      .getBinaryStatuses()
      .then(seedBinaryStatuses)
      .catch((e) => console.error('[bin-status] snapshot failed', e))
    return unlisten
  }, [])
  return null
}
