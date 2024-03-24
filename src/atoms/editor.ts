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

type EditorScrollTriggers = 'waveform' | 'timeline' | null

const editorScrollAtom = atom<[EditorScrollTriggers, number]>(['timeline', 0])
export const setEditorScroll = (setBy: EditorScrollTriggers, top: number) =>
  store.set(editorScrollAtom, [setBy, top])
export const subEditorScroll = (
  except: EditorScrollTriggers,
  fn: (top: number) => void,
) =>
  store.sub(editorScrollAtom, () => {
    const value = store.get(editorScrollAtom)
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
