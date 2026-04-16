import {
  getCurrentEditingTask,
  getIsFollowMode,
  setCurrentEditingTask,
  setDragInvalidId,
  setDragLimitY,
  setDraggingRowId,
  setHighlightedRowIds,
} from '@/atoms/editor'
import { determineCurrentTextId } from '@/components/layout/editor/follow-mode-dispatcher/utils'
import { seekHeight, seekTime } from '@/components/layout/editor/waveform-canvas/utils'
import { player } from '@/lib/player'
import { userScrub } from '@/subjects/editor'
import { produce } from 'immer'
import { RefObject, useRef } from 'react'
import { BoundaryHandle } from './compute-boundaries'

const DRAG_THRESHOLD = 3
const MIN_DURATION = 0.1
const EDGE_ZONE = 60
const MAX_SCROLL_SPEED = 12

function setBodyCursor(cursor: string) {
  document.body.style.cursor = cursor
}

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
    initialStart: number
    initialEnd: number
    grabTime: number
    valid: boolean
  } | null>(null)

  function getContentY(clientY: number) {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return 0
    const rect = scrollEl.getBoundingClientRect()
    return clientY - rect.top + scrollEl.scrollTop
  }

  function applyDrag(contentY: number) {
    const s = stateRef.current
    if (!s) return

    const data = getCurrentEditingTask().result?.data
    if (!data) return

    const { boundary } = s

    if (boundary.type === 'move') {
      const newGrabTime = seekTime(contentY)
      const delta = newGrabTime - s.grabTime
      const duration = s.initialEnd - s.initialStart
      const newStart = Math.max(0, s.initialStart + delta)
      const newEnd = newStart + duration

      const overlaps = data.some(
        (d) => d.id !== boundary.id && newStart < d.end && newEnd > d.start,
      )
      s.valid = !overlaps
      setDragInvalidId(overlaps ? boundary.id : null)

      setCurrentEditingTask((prev) =>
        produce(prev, (draft) => {
          if (!draft.result) return
          const item = draft.result.data.find((d) => d.id === boundary.id)
          if (!item) return
          item.start = newStart
          item.end = newEnd
        }),
      )
    } else {
      const idx = data.findIndex((d) => d.id === boundary.id)
      if (idx === -1) return

      const newTime = seekTime(contentY)
      const { type } = boundary
      let min = 0
      let max = Infinity

      if (type === 'end') {
        min = data[idx].start + MIN_DURATION
        if (idx < data.length - 1) max = data[idx + 1].start
      } else {
        max = data[idx].end - MIN_DURATION
        if (idx > 0) min = data[idx - 1].end
      }

      const clamped = Math.max(min, Math.min(max, newTime))
      setCurrentEditingTask((prev) =>
        produce(prev, (draft) => {
          if (!draft.result) return
          const item = draft.result.data.find((d) => d.id === boundary.id)
          if (!item) return
          if (type === 'end') {
            item.end = clamped
          } else {
            item.start = clamped
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
      scrollEl.scrollTo({ top: scrollEl.scrollTop + speed })
      const contentY = getContentY(s.lastClientY)
      applyDrag(contentY)
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
      setBodyCursor(s.boundary.type === 'move' ? 'grabbing' : 'ns-resize')
      userScrub.next('start')

      setDraggingRowId(s.boundary.id)
      setHighlightedRowIds([s.boundary.id])

      if (s.boundary.type !== 'move') {
        const data = getCurrentEditingTask().result?.data
        if (data) {
          const idx = data.findIndex((d) => d.id === s.boundary.id)
          if (s.boundary.type === 'end' && idx < data.length - 1) {
            setDragLimitY(seekHeight(data[idx + 1].start))
          } else if (s.boundary.type === 'start' && idx > 0) {
            setDragLimitY(seekHeight(data[idx - 1].end))
          }
        }
      }

      s.rafId = requestAnimationFrame(autoScrollTick)
    }

    const contentY = getContentY(e.clientY)
    applyDrag(contentY)
  }

  function onPointerUp(e: PointerEvent) {
    const s = stateRef.current
    if (!s || s.pointerId !== e.pointerId) return

    if (s.dragging) {
      if (s.handleEl.hasPointerCapture(e.pointerId)) {
        s.handleEl.releasePointerCapture(e.pointerId)
      }
      cancelAnimationFrame(s.rafId)
      setBodyCursor('')

      if (s.boundary.type === 'move') {
        if (!s.valid) {
          // Revert to original position.
          setCurrentEditingTask((prev) =>
            produce(prev, (draft) => {
              if (!draft.result) return
              const item = draft.result.data.find(
                (d) => d.id === s.boundary.id,
              )
              if (!item) return
              item.start = s.initialStart
              item.end = s.initialEnd
            }),
          )
        } else {
          // Re-sort by start time so neighbor-based clamping stays correct.
          setCurrentEditingTask((prev) =>
            produce(prev, (draft) => {
              if (!draft.result) return
              draft.result.data.sort((a, b) => a.start - b.start)
            }),
          )
        }
      }

      if (getIsFollowMode()) {
        const id = determineCurrentTextId(player.currentTime)
        setHighlightedRowIds(id ? [id] : [])
      } else {
        setHighlightedRowIds([])
      }
      setDraggingRowId(null)
      setDragLimitY(-1)
      setDragInvalidId(null)
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
    const d = data?.find((item) => item.id === boundary.id)

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
      valid: true,
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }

  return { onPointerDown }
}
