import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface WhisperServerConfig {
  startupDir: string
  host: string
  port: number
  device: 'auto' | 'cpu' | 'cuda'
  quantizationType: string
  modelDir: string
  model: string
}

const configAtom = atomWithStorage<WhisperServerConfig>(
  'whisper-server.config',
  {
    startupDir: '',
    host: '127.0.0.1',
    port: 23330,
    device: 'auto',
    quantizationType: 'default',
    modelDir: '',
    model: '',
  },
  undefined,
  {
    getOnInit: true,
  },
)

export const useWhisperServerConfig = () => useAtom(configAtom)
