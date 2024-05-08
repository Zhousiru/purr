import { Subject } from 'rxjs'

export const textHighlight = new Subject<{
  index: number
}>()

export const textFocus = new Subject<{
  index: number
}>()

export const markFocus = new Subject<{
  index: number
}>()

export const waveformScroll = new Subject<{ top: number }>()
