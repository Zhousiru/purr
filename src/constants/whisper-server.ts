import { WhisperServerConfig } from '@/types/whisper-server'

export const whisperServerDefaultConfig: WhisperServerConfig = {
  startupDir: '',
  host: '127.0.0.1',
  port: 23330,
  device: 'auto',
  quantizationType: 'default',
  modelDir: '',
  model: '',
}
