import { getWhisperServerConfig } from '@/atoms/whisper-server'
import { WhisperServerNeedConfigure } from '@/components/modal/whisper-server-need-configure'
import { whisperServerDefaultConfig } from '@/constants/whisper-server'
import { ComponentProps, useState } from 'react'

export function useWhisperNeedConfigureModal() {
  const [isOpen, setIsOpen] = useState(false)

  const register: ComponentProps<typeof WhisperServerNeedConfigure> = {
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
