import {
  getEffectiveResolution,
  getZoomLevel,
  setZoomLevel,
  useAddMarkContextValue,
  ZOOM_LEVELS,
  ZoomLevel,
} from '@/atoms/editor'
import {
  blockDuration,
  fillColor,
  preload,
  resolution,
  widthScale,
} from '@/constants/editor'
import { usePointerInRect } from '@/hooks/usePointerInRect'
import { Waveform } from '@/lib/waveform'
import { userScrub } from '@/subjects/editor'
import { RefObject, useEffect, useRef } from 'react'
import { HoverLayerRef } from './HoverLayer'
import { seekHeightWithResolution, seekTimeWithResolution } from './utils'

const DRAG_THRESHOLD = 3

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

  // Position the fixed hover layer — use the scroll container's viewport rect
  // with the waveform column's width for a stable bounding.
  useEffect(() => {
    const updateBounding = () => {
      const scrollRect = scrollContainerRef.current?.getBoundingClientRect()
      const waveformWidth = containerRef.current?.clientWidth
      if (!scrollRect || !waveformWidth) return
      hoverLayerRef.current?.updateBounding(
        new DOMRect(
          scrollRect.left,
          scrollRect.top,
          waveformWidth,
          scrollRect.height,
        ),
      )
    }

    const observer = new ResizeObserver(updateBounding)
    if (scrollContainerRef.current) observer.observe(scrollContainerRef.current)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [scrollContainerRef, hoverLayerRef])

  // Drive the hoisted hover layer from rect hit-testing, not DOM enter/leave.
  // The indicator's button lives outside this container's subtree, so relying
  // on mouseleave would flicker each time the pointer crossed onto the button.
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

  // Handle container scroll for hover layer
  useEffect(() => {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return

    const onScroll = () => {
      hoverLayerRef.current?.updateOffset(scrollEl.scrollTop)
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [scrollContainerRef, hoverLayerRef])

  // Handle zoom with Ctrl + wheel
  useEffect(() => {
    const container = containerRef.current
    const scrollEl = scrollContainerRef.current
    if (!container || !scrollEl) return

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()

      const currentZoom = getZoomLevel()
      const currentIndex = ZOOM_LEVELS.indexOf(currentZoom)

      const newIndex =
        e.deltaY > 0
          ? Math.max(0, currentIndex - 1)
          : Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1)
      const newZoom = ZOOM_LEVELS[newIndex] as ZoomLevel

      if (newZoom === currentZoom) return

      const mouseY = e.clientY - scrollEl.getBoundingClientRect().top
      const scrollTop = scrollEl.scrollTop
      const oldResolution = getEffectiveResolution()
      const mouseTime = seekTimeWithResolution(
        scrollTop + mouseY,
        oldResolution,
      )

      setZoomLevel(newZoom)

      requestAnimationFrame(() => {
        const newResolution = getEffectiveResolution()
        const newMouseHeight = seekHeightWithResolution(
          mouseTime,
          newResolution,
        )
        scrollEl.scrollTop = newMouseHeight - mouseY
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [scrollContainerRef])

  const addMarkContext = useAddMarkContextValue()

  return (
    <div
      ref={containerRef}
      className="relative touch-none overflow-hidden select-none"
      style={{ height: totalHeight }}
    >
      {/* Canvas with absolute positioning */}
      <canvas ref={canvasRef} className="pointer-events-none absolute left-0" />

      {/* AddMark indicator */}
      {addMarkContext && (
        <div
          className="border-accent pointer-events-none absolute inset-x-0 border-t"
          style={{ top: addMarkContext.startHeight }}
        />
      )}
    </div>
  )
}
