import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface WhisperServerConfig {
  startupPath: string
  host: string
  port: string
  device: 'auto' | 'cpu' | 'cuda'
  quantizationType: string
  model: string
}

const configAtom = atomWithStorage<WhisperServerConfig>(
  'whisper-server.config',
  {
    startupPath: '',
    host: '127.0.0.1',
    port: '23330',
    device: 'auto',
    quantizationType: 'default',
    model: '',
  },
)

export const useWhisperServerConfig = () => useAtom(configAtom)
