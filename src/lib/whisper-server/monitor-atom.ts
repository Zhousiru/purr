import { atom } from 'jotai'
import { store } from '../store'
import { Monitor } from './monitor'

export function createMonitorAtom() {
  const monitor = new Monitor()
  const monitorAtom = atom<{
    status: 'disconnected' | 'connected'
    monitor: Monitor
  }>({
    status: 'disconnected',
    monitor: monitor,
  })
  monitor.bindCallbacks({
    onConnected() {
      store.set(monitorAtom, (prev) => ({ ...prev, status: 'connected' }))
    },
    onDisconnected() {
      store.set(monitorAtom, (prev) => ({ ...prev, status: 'disconnected' }))
    },
  })

  return monitorAtom
}
