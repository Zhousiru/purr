import { marginBlock } from '@/constants/waveform'
import { store } from '@/lib/store'
import { atom, useAtomValue } from 'jotai'

const waveformCanvasHeightAtom = atom<number>(0)
export const setWaveformCanvasHeight = (height: number) =>
  store.set(waveformCanvasHeightAtom, height)

const waveformHeightAtom = atom<number>(
  (get) => get(waveformCanvasHeightAtom) + marginBlock * 2,
)
export const useWaveformHeightValue = () => useAtomValue(waveformHeightAtom)

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

const currentAudioDurationAtom = atom<number>(0)
export const setCurrentAudioDuration = (duration: number) =>
  store.set(currentAudioDurationAtom, duration)
export const useCurrentAudioDurationValue = () =>
  useAtomValue(currentAudioDurationAtom)
