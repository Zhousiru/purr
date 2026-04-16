import { useSyncExternalStore } from 'react'

type Scope = 'inner' | 'outer'

const counters: Record<Scope, number> = { inner: 0, outer: 0 }
const listeners: Record<Scope, Set<() => void>> = {
  inner: new Set(),
  outer: new Set(),
}

function trigger(scope: Scope) {
  counters[scope] += 1
  listeners[scope].forEach((l) => l())
}

export function useErrorTrigger(scope: Scope) {
  const count = useSyncExternalStore(
    (cb) => {
      listeners[scope].add(cb)
      return () => listeners[scope].delete(cb)
    },
    () => counters[scope],
  )
  if (count > 0) {
    throw new Error(`Manually triggered ${scope} error boundary`)
  }
}

declare global {
  interface Window {
    errorBoundaries: {
      triggerInner: () => void
      triggerOuter: () => void
    }
  }
}

window.errorBoundaries = {
  triggerInner: () => trigger('inner'),
  triggerOuter: () => trigger('outer'),
}
