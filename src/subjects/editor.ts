import { Subject } from 'rxjs'

export const textHighlight = new Subject<{
  index: number
  to: number
}>()

export const markHighlight = new Subject<{
  index: number
  to: number
}>()

export const waveformScroll = new Subject<number>()
