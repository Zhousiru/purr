import { store } from '@/lib/store'
import { atom, useAtom } from 'jotai'
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

export type TerminalLineType = 'launch' | 'exit' | 'stdout' | 'stderr'

export interface TerminalLine {
  type: TerminalLineType
  data: string
}

const configAtom = atomWithStorage<WhisperServerConfig>(
  'whisper-server-config',
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

// TODO: Recover running status from backend.
export const isRunningAtom = atom(false)
export const setIsRunning = (value: boolean) => store.set(isRunningAtom, value)

export const isReadyAtom = atom(false)
export const setIsReady = (value: boolean) => store.set(isReadyAtom, value)

export const terminalLinesAtom = atom<TerminalLine[]>([])
export function pushTerminalLine(type: TerminalLineType, data: string) {
  store.set(terminalLinesAtom, (prev) => [...prev, { type, data }])
}
export const resetTerminalLines = () => store.set(terminalLinesAtom, [])
