import { whisperServerDefaultConfig } from '@/constants/whisper-server'
import { store } from '@/lib/store'
import { createMonitorAtom } from '@/lib/whisper-server/monitor-atom'
import {
  DaemonEventType,
  TerminalLine,
  WhisperServerConfig,
} from '@/types/whisper-server'
import { atom, useAtom, useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const configAtom = atomWithStorage<WhisperServerConfig>(
  'whisper-server-config',
  whisperServerDefaultConfig,
  undefined,
  {
    getOnInit: true,
  },
)

export const getWhisperServerConfig = () => store.get(configAtom)
export const useWhisperServerConfig = () => useAtom(configAtom)
export const useWhisperServerConfigValue = () => useAtomValue(configAtom)

export const isRunningAtom = atom(false)
export const setIsRunning = (value: boolean) => store.set(isRunningAtom, value)

export const isReadyAtom = atom(false)
export const setIsReady = (value: boolean) => store.set(isReadyAtom, value)

export const terminalLinesAtom = atom<TerminalLine[]>([])
export function pushTerminalLine(type: DaemonEventType, data: string) {
  store.set(terminalLinesAtom, (prev) => [...prev, { type, data }])
}
export const resetTerminalLines = () => store.set(terminalLinesAtom, [])

export const monitorAtom = createMonitorAtom()
export const useMonitorStatusValue = () => useAtomValue(monitorAtom).status
export const getMonitorStatus = () => store.get(monitorAtom).status
export const getMonitor = () => store.get(monitorAtom).monitor
