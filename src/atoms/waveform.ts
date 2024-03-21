import { store } from '@/lib/store'
import { atom, useAtomValue } from 'jotai'

const waveformHeightAtom = atom<number>(0)
export const useWaveformHeightValue = () => useAtomValue(waveformHeightAtom)
export const setWaveformHeight = (height: number) =>
  store.set(waveformHeightAtom, height)

type WaveformScrollTriggers = 'waveform' | 'timeline'

const waveformScrollAtom = atom<[WaveformScrollTriggers, number]>([
  'timeline',
  0,
])
export const setWaveformScroll = (setBy: WaveformScrollTriggers, top: number) =>
  store.set(waveformScrollAtom, [setBy, top])
export const subWaveformScroll = (
  except: WaveformScrollTriggers,
  fn: (top: number) => void,
) =>
  store.sub(waveformScrollAtom, () => {
    const value = store.get(waveformScrollAtom)
    if (value[0] === except) {
      return
    }
    fn(value[1])
  })
