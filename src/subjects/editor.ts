import { Subject } from 'rxjs'

export const waveformScroll = new Subject<{
  top: number
  behavior?: ScrollBehavior
}>()

// Emitted by the waveform drag handler so the follow-mode dispatcher can
// pause / resume playback without relying on scroll-event detection (which
// races with RAF-driven programmatic scroll writes).
export const userScrub = new Subject<'start' | 'end'>()

// Single document-level pointer stream. One listener emits here, consumers
// subscribe via `usePointerInRect` (no per-consumer document listeners).
export const pointerMove = new Subject<{ x: number; y: number }>()

let lastPointerX = -Infinity
let lastPointerY = -Infinity
pointerMove.subscribe(({ x, y }) => {
  lastPointerX = x
  lastPointerY = y
})
export const getPointerPosition = () => ({ x: lastPointerX, y: lastPointerY })
