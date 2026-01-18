import {
  getMonitorStatus,
  getWhisperServerConfig,
  monitorAtom,
} from '@/atoms/whisper-server'
import { whisperServerDefaultConfig } from '@/constants/whisper-server'
import { daemonSubject } from '@/lib/events/subjects'
import { store } from '@/lib/store'
import { startWhisperServer } from '@/lib/whisper-server'
import { ComponentProps, useState } from 'react'
import { WhisperServerGuardModal } from '.'
import { WhisperServerNeedConfigureModal } from './WhisperServerNeedConfigureModal'
import { WhisperServerSpinnerModal } from './WhisperServerSpinnerModal'

function useWhisperNeedConfigureModal() {
  const [isOpen, setIsOpen] = useState(false)

  const register: ComponentProps<typeof WhisperServerNeedConfigureModal> = {
    isOpen,
    onClose: setIsOpen,
  }
  const checkConfigured = () => {
    const currentConfig = JSON.stringify(getWhisperServerConfig())
    const defaultConfig = JSON.stringify(whisperServerDefaultConfig)
    if (currentConfig === defaultConfig) {
      setIsOpen(true)
      return false
    }
    return true
  }

  return { register, checkConfigured } as const
}

function useWhisperServerLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFailed, setIsFailed] = useState(false)

  const register: ComponentProps<typeof WhisperServerSpinnerModal> = {
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
          if (!daemonSub.closed) {
            daemonSub.unsubscribe()
          }
          setIsOpen(false)
          resolve(true)
        }
      })

      let isLaunched = false

      const daemonSub = daemonSubject.subscribe((payload) => {
        if (payload.type === 'launch') {
          // We detecte the launch event, then wait for the exit event.
          // Because we may receive exit event from the legacy server.
          isLaunched = true
        }

        if (isLaunched && payload.type === 'exit') {
          // Failed to launch.
          unsubMonitor()
          if (!daemonSub.closed) {
            daemonSub.unsubscribe()
          }
          setIsFailed(true)
          resolve(false)
        }
      })
    })

  return { register, launch } as const
}

export function useWhisperServerGuard() {
  const { register: configureRegister, checkConfigured } =
    useWhisperNeedConfigureModal()
  const { register: spinnerRegister, launch } = useWhisperServerLauncher()

  const register: ComponentProps<typeof WhisperServerGuardModal> = {
    configureRegister,
    spinnerRegister,
  }
  const guard = async (fn: () => void) => {
    if (!checkConfigured()) {
      return
    }
    if (getMonitorStatus() !== 'connected') {
      if (await launch()) {
        fn()
      }
      return
    }
    fn()
  }

  return { register, guard } as const
}
