'use client'

import {
  setWaveformViewportHeight,
  setWaveformVisibleArea,
  useAddMarkContextValue,
} from '@/atoms/editor'
import {
  blockDuration,
  fillColor,
  marginBlock,
  preload,
  resolution,
  widthScale,
} from '@/constants/editor'
import { useWaveformScroll } from '@/hooks/useWaveformScroll'
import { player } from '@/lib/player'
import { mergeRefs } from '@/lib/utils/merge-refs'
import { Waveform } from '@/lib/waveform'
import { waveformScroll } from '@/subjects/editor'
import { MouseEventHandler, Ref, useEffect, useRef } from 'react'
import { HoverLayer, HoverLayerRef } from './HoverLayer'
import { VirtualMarks } from './VirtualMarks'
import { seekHeight } from './utils'

type WaveformCanvasProps = {
  path: string
  duration: number
  mergeChannels: boolean
  ref?: Ref<HTMLDivElement>
}

export const WaveformCanvas = ({
  path,
  duration,
  mergeChannels,
  ref,
}: WaveformCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveformRef = useRef<Waveform | null>(null)

  const scrollState = useWaveformScroll(containerRef, {
    duration,
    resolution,
    marginBlock,
  })

  // Sync to global state for VirtualMarks and FollowModeDispatcher
  useEffect(() => {
    setWaveformVisibleArea(
      scrollState.scrollTop,
      scrollState.scrollTop + scrollState.viewportHeight,
    )
    setWaveformViewportHeight(scrollState.viewportHeight)
  }, [scrollState.scrollTop, scrollState.viewportHeight])

  // Initialize Waveform
  useEffect(() => {
    waveformRef.current = new Waveform(
      canvasRef.current!,
      containerRef.current!,
      path,
      duration,
      {
        blockDuration,
        mergeChannels,
        preload,
        resolution,
        fillColor,
        widthScale,
        marginBlock,
      },
    )

    return () => {
      waveformRef.current?.dispose()
      waveformRef.current = null
    }
  }, [path, duration, mergeChannels])

  // Reset scrollTop when path changes
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 })
  }, [path])

  // Position the current indicator
  const currentIndicatorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const unsub = player.subCurrentTime((time) => {
      if (!currentIndicatorRef.current) return
      currentIndicatorRef.current.style.top =
        Math.round(seekHeight(time)).toString() + 'px'
    })
    return () => unsub()
  }, [])

  // Position the fixed hover layer
  const hoverLayerRef = useRef<HoverLayerRef>(null)
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      hoverLayerRef.current?.updateBounding(
        containerRef.current!.getBoundingClientRect(),
      )
    })
    observer.observe(containerRef.current!)

    return () => observer.disconnect()
  })

  // Handle mouse events
  const handleMouseEnter = () => hoverLayerRef.current?.setIsHover(true)
  const handleMouseLeave = () => hoverLayerRef.current?.setIsHover(false)
  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
    hoverLayerRef.current?.updateMouse(e.clientX, e.clientY)
  }

  function handleContainerScroll() {
    hoverLayerRef.current?.updateOffset(containerRef.current!.scrollTop)
  }

  // Handle external scroll commands
  useEffect(() => {
    const sub = waveformScroll.subscribe(({ top }) => {
      containerRef.current?.scrollTo({ top, behavior: 'smooth' })
    })

    return () => sub.unsubscribe()
  }, [])

  const addMarkContext = useAddMarkContextValue()

  return (
    <div
      ref={mergeRefs([containerRef, ref])}
      className="scrollbar-none absolute inset-0 overflow-y-auto"
      onScroll={handleContainerScroll}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Scroll Shim - contains Canvas and VirtualMarks for synchronized scrolling */}
      <div
        className="pointer-events-none relative overflow-hidden"
        style={{ height: scrollState.totalHeight }}
      >
        {/* Canvas with absolute positioning - moves with scroll shim */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute left-0"
        />
        <VirtualMarks />
      </div>

      {/* Current playback indicator */}
      <div
        ref={currentIndicatorRef}
        className="pointer-events-none absolute inset-x-0 z-30 border-t border-blue-500"
      />

      {/* AddMark indicator */}
      {addMarkContext && (
        <div
          className="pointer-events-none absolute inset-x-0 z-40 border-t border-amber-500"
          style={{ top: addMarkContext.startHeight }}
        />
      )}

      {/* Hover layer */}
      <HoverLayer ref={hoverLayerRef} />
    </div>
  )
}
