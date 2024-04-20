import { Subject } from 'rxjs'

export const textHighlight = new Subject<{
  index: number
}>()

export const markHighlight = new Subject<{
  index: number
}>()

export const waveformScroll = new Subject<{ top: number }>()
