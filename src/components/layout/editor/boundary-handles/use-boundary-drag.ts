import {
  getCurrentEditingTask,
  setCurrentEditingTask,
  setDragLimitY,
  setHighlightedRows,
} from '@/atoms/editor'
import { seekHeight, seekTime } from '@/components/layout/editor/waveform-canvas/utils'
import { userScrub } from '@/subjects/editor'
import { produce } from 'immer'
import { RefObject, useRef } from 'react'
import { BoundaryHandle } from './compute-boundaries'

const DRAG_THRESHOLD = 3
const MIN_DURATION = 0.1
const EDGE_ZONE = 60
const MAX_SCROLL_SPEED = 12

export function useBoundaryDrag(
  scrollContainerRef: RefObject<HTMLDivElement | null>,
) {
  const stateRef = useRef<{
    boundary: BoundaryHandle
    pointerId: number
    startClientY: number
    handleEl: HTMLElement
    dragging: boolean
    rafId: number
    lastClientY: number
    // For 'move': preserve the initial times and grab offset
    initialStart: number
    initialEnd: number
    grabTime: number
  } | null>(null)

  function getContentY(clientY: number) {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return 0
    const rect = scrollEl.getBoundingClientRect()
    return clientY - rect.top + scrollEl.scrollTop
  }

  function applyDrag(contentY: number, boundary: BoundaryHandle) {
    const data = getCurrentEditingTask().result?.data
    if (!data) return

    const s = stateRef.current
    if (!s) return

    if (boundary.type === 'move') {
      const newGrabTime = seekTime(contentY)
      const delta = newGrabTime - s.grabTime
      const duration = s.initialEnd - s.initialStart
      let newStart = s.initialStart + delta
      let newEnd = s.initialEnd + delta

      // Clamp against previous card's end
      const prevEnd = boundary.index > 0 ? data[boundary.index - 1].end : 0
      if (newStart < prevEnd) {
        newStart = prevEnd
        newEnd = newStart + duration
      }

      // Clamp against next card's start
      const nextStart =
        boundary.index < data.length - 1
          ? data[boundary.index + 1].start
          : Infinity
      if (newEnd > nextStart) {
        newEnd = nextStart
        newStart = newEnd - duration
      }

      setCurrentEditingTask((prev) =>
        produce(prev, (draft) => {
          if (!draft.result) return
          draft.result.data[boundary.index].start = newStart
          draft.result.data[boundary.index].end = newEnd
        }),
      )
    } else {
      // start / end boundary
      const newTime = seekTime(contentY)
      const { type, index } = boundary
      let min = 0
      let max = Infinity

      if (type === 'end') {
        min = data[index].start + MIN_DURATION
        if (index < data.length - 1) max = data[index + 1].start
      } else {
        max = data[index].end - MIN_DURATION
        if (index > 0) min = data[index - 1].end
      }

      const clamped = Math.max(min, Math.min(max, newTime))
      setCurrentEditingTask((prev) =>
        produce(prev, (draft) => {
          if (!draft.result) return
          if (type === 'end') {
            draft.result.data[index].end = clamped
          } else {
            draft.result.data[index].start = clamped
          }
        }),
      )
    }
  }

  function autoScrollTick() {
    const s = stateRef.current
    if (!s || !s.dragging) return

    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return

    const rect = scrollEl.getBoundingClientRect()
    const distFromTop = s.lastClientY - rect.top
    const distFromBottom = rect.bottom - s.lastClientY

    let speed = 0
    if (distFromTop < EDGE_ZONE && distFromTop >= 0) {
      speed = -MAX_SCROLL_SPEED * (1 - distFromTop / EDGE_ZONE)
    } else if (distFromBottom < EDGE_ZONE && distFromBottom >= 0) {
      speed = MAX_SCROLL_SPEED * (1 - distFromBottom / EDGE_ZONE)
    }

    if (speed !== 0) {
      scrollEl.scrollTop += speed
      const contentY = getContentY(s.lastClientY)
      applyDrag(contentY, s.boundary)
    }

    s.rafId = requestAnimationFrame(autoScrollTick)
  }

  function onPointerMove(e: PointerEvent) {
    const s = stateRef.current
    if (!s || s.pointerId !== e.pointerId) return

    s.lastClientY = e.clientY

    if (!s.dragging) {
      if (Math.abs(e.clientY - s.startClientY) < DRAG_THRESHOLD) return
      s.dragging = true
      s.handleEl.setPointerCapture(e.pointerId)
      document.body.style.cursor =
        s.boundary.type === 'move' ? 'grabbing' : 'ns-resize'
      userScrub.next('start')

      setHighlightedRows([s.boundary.index])

      // Show the outer expansion limit line (boundary handles only).
      if (s.boundary.type !== 'move') {
        const data = getCurrentEditingTask().result?.data
        if (data) {
          const { type, index } = s.boundary
          if (type === 'end' && index < data.length - 1) {
            setDragLimitY(seekHeight(data[index + 1].start))
          } else if (type === 'start' && index > 0) {
            setDragLimitY(seekHeight(data[index - 1].end))
          }
        }
      }

      s.rafId = requestAnimationFrame(autoScrollTick)
    }

    const contentY = getContentY(e.clientY)
    applyDrag(contentY, s.boundary)
  }

  function onPointerUp(e: PointerEvent) {
    const s = stateRef.current
    if (!s || s.pointerId !== e.pointerId) return

    if (s.dragging) {
      if (s.handleEl.hasPointerCapture(e.pointerId)) {
        s.handleEl.releasePointerCapture(e.pointerId)
      }
      cancelAnimationFrame(s.rafId)
      document.body.style.cursor = ''
      setHighlightedRows([])
      setDragLimitY(-1)
      userScrub.next('end')
    }

    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerUp)
    stateRef.current = null
  }

  function onPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    boundary: BoundaryHandle,
  ) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const data = getCurrentEditingTask().result?.data
    const d = data?.[boundary.index]

    stateRef.current = {
      boundary,
      pointerId: e.pointerId,
      startClientY: e.clientY,
      handleEl: e.currentTarget,
      dragging: false,
      rafId: 0,
      lastClientY: e.clientY,
      initialStart: d?.start ?? 0,
      initialEnd: d?.end ?? 0,
      grabTime: seekTime(getContentY(e.clientY)),
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }

  return { onPointerDown }
}
