'use client'

import { ReactNode, useSyncExternalStore } from 'react'

export function ClientOnly({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!isClient) {
    return null
  }

  return children
}
