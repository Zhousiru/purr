import { getWhisperServerConfig, monitorAtom } from '@/atoms/whisper-server'
import { daemonSubject } from '@/lib/events/subjects'
import { store } from '@/lib/store'
import { startWhisperServer } from '@/lib/whisper-server'
import { ComponentProps, useState } from 'react'
import { WhisperServerSpinner } from '.'

export function useWhisperServerLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFailed, setIsFailed] = useState(false)

  const register: ComponentProps<typeof WhisperServerSpinner> = {
    isOpen,
    onClose: setIsOpen,
    isFailed,
  }
  const launch = () =>
    new Promise<boolean>((resolve) => {
      setIsFailed(false)
      setIsOpen(true)
      startWhisperServer(getWhisperServerConfig())

      const unsubMonitor = store.sub(monitorAtom, () => {
        const status = store.get(monitorAtom).status
        if (status === 'connected') {
          unsubMonitor()
          !daemonSub.closed && daemonSub.unsubscribe()
          setIsOpen(false)
          resolve(true)
        }
      })

      const daemonSub = daemonSubject.subscribe((payload) => {
        if (payload.type === 'exit') {
          // Failed to launch.
          unsubMonitor()
          !daemonSub.closed && daemonSub.unsubscribe()
          setIsFailed(true)
          resolve(false)
        }
      })
    })

  return { register, launch } as const
}
