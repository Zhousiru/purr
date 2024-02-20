'use client'

import { store } from '@/lib/store'
import { Provider } from 'jotai'
import { ReactNode } from 'react'

export function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}
