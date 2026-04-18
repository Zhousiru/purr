import {
  setWaveformColumnWidth,
  useAddMarkContextValue,
} from '@/atoms/editor'
import {
  blockDuration,
  fillColor,
  LEFT_SAFE_AREA,
  preload,
  resolution,
  RIGHT_SAFE_AREA,
  widthScale,
} from '@/constants/editor'
import { usePointerInRect } from '@/hooks/usePointerInRect'
import { Waveform } from '@/lib/waveform'
import { userScrub } from '@/subjects/editor'
import { RefObject, useEffect, useRef } from 'react'
import { HoverLayerRef } from './HoverLayer'
import { TimeAxisBackground } from './TimeAxisBackground'
import { handleZoomWheel } from './utils'

const DRAG_THRESHOLD = 3

function isInsidePanelSafeArea(el: HTMLElement, clientX: number) {
  const rect = el.getBoundingClientRect()
  return (
    clientX - rect.left < LEFT_SAFE_AREA ||
    rect.right - clientX < RIGHT_SAFE_AREA
  )
}

type WaveformCanvasProps = {
  path: string
  duration: number
  mergeChannels: boolean
  scrollContainerRef: RefObject<HTMLDivElement | null>
  hoverLayerRef: RefObject<HoverLayerRef | null>
  totalHeight: number
}

export const WaveformCanvas = ({
  path,
  duration,
  mergeChannels,
  scrollContainerRef,
  hoverLayerRef,
  totalHeight,
}: WaveformCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveformRef = useRef<Waveform | null>(null)

  // Initialize Waveform
  useEffect(() => {
    if (!scrollContainerRef.current) return

    waveformRef.current = new Waveform(
      canvasRef.current!,
      containerRef.current!,
      scrollContainerRef.current,
      path,
      duration,
      {
        blockDuration,
        mergeChannels,
        preload,
        resolution,
        fillColor,
        widthScale,
      },
    )

    return () => {
      waveformRef.current?.dispose()
      waveformRef.current = null
    }
  }, [path, duration, mergeChannels, scrollContainerRef])

  useEffect(() => {
    const update = () => {
      const waveformWidth = containerRef.current?.clientWidth
      if (!waveformWidth) return
      setWaveformColumnWidth(waveformWidth)
    }

    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  // Hit-test rather than mouseenter/leave so the indicator buttons
  // (rendered outside this subtree) don't cause flicker.
  usePointerInRect({
    targetRef: containerRef,
    onUpdate: ({ inside, x, y }) => {
      if (inside) {
        hoverLayerRef.current?.updateMouse(x, y)
      }
      hoverLayerRef.current?.setIsHover(inside)
    },
  })

  // Drag-to-scroll
  useEffect(() => {
    const container = containerRef.current
    const scrollEl = scrollContainerRef.current
    if (!container || !scrollEl) return

    let state: {
      startY: number
      startScrollTop: number
      pointerId: number
      dragging: boolean
    } | null = null

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      // Bail near the panel's left/right edges. Those are reserved for the
      // adjacent resizable separator's hit zone.
      if (isInsidePanelSafeArea(container, e.clientX)) return
      state = {
        startY: e.clientY,
        startScrollTop: scrollEl.scrollTop,
        pointerId: e.pointerId,
        dragging: false,
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!state || state.pointerId !== e.pointerId) return

      const delta = e.clientY - state.startY

      if (!state.dragging) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return
        state.dragging = true
        // Capture once we commit — lets child button clicks work below threshold.
        container.setPointerCapture(e.pointerId)
        userScrub.next('start')
      }

      scrollEl.scrollTop = state.startScrollTop - delta
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!state || state.pointerId !== e.pointerId) return
      if (state.dragging) {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId)
        }
        userScrub.next('end')
      }
      state = null
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointercancel', onPointerUp)

    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerUp)
    }
  }, [scrollContainerRef])

  // Attached to the scroll container so wheel events from the hover layer
  // pill (rendered outside this subtree) also reach the zoom handler.
  useEffect(() => {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return

    const handleWheel = (e: WheelEvent) => {
      handleZoomWheel(e, scrollEl)
    }

    scrollEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => scrollEl.removeEventListener('wheel', handleWheel)
  }, [scrollContainerRef])

  const addMarkContext = useAddMarkContextValue()

  return (
    <div
      ref={containerRef}
      className="relative touch-none overflow-hidden select-none"
      style={{ height: totalHeight }}
    >
      <TimeAxisBackground />

      <canvas ref={canvasRef} className="pointer-events-none absolute left-0" />

      {addMarkContext && (
        <div
          className="border-accent pointer-events-none absolute inset-x-0 border-t"
          style={{ top: addMarkContext.startHeight }}
        />
      )}
    </div>
  )
}
