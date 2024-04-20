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
import { player } from '@/lib/player'
import { mergeRefs } from '@/lib/utils/merge-refs'
import { Waveform } from '@/lib/waveform'
import { waveformScroll } from '@/subjects/editor'
import { MouseEventHandler, forwardRef, useEffect, useRef } from 'react'
import { HoverLayer, HoverLayerRef } from './HoverLayer'
import { VirtualMarks } from './VirtualMarks'
import { seekHeight } from './utils'

export const WaveformCanvas = forwardRef<
  HTMLDivElement,
  {
    path: string
    duration: number
    mergeChannels: boolean
  }
>(function WaveformCanvas({ path, duration, mergeChannels }, ref) {
  // Bind `Waveform`.
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<Waveform | null>(null)

  useEffect(() => {
    waveformRef.current = new Waveform(
      containerRef.current!,
      canvasContainerRef.current!,
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
      {
        onContainerVisibleAreaUpdate(startY, endY) {
          setWaveformVisibleArea(startY, endY)
        },
      },
    )

    return () => {
      waveformRef.current!.dispose()
    }
  }, [duration, mergeChannels, path])

  // Recover `scrollTop` when `path` prop changed.
  useEffect(() => {
    containerRef.current!.scrollTo({ top: 0 })
  }, [path])

  // Position the current indicator.
  const currentIndicatorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const unsub = player.subCurrentTime((time) => {
      if (!currentIndicatorRef.current) return

      currentIndicatorRef.current.style.top =
        Math.round(seekHeight(time)).toString() + 'px'
    })
    return () => unsub()
  }, [])

  // Position the fixed hover layer.
  // We use the fixed hover layer to avoid lag while scrolling.
  // And update waveform viewport height.
  const hoverLayerRef = useRef<HoverLayerRef>(null)
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      hoverLayerRef.current!.updateBounding(
        containerRef.current!.getBoundingClientRect(),
      )
      setWaveformViewportHeight(containerRef.current!.offsetHeight)
    })
    observer.observe(containerRef.current!)

    return () => observer.disconnect()
  })

  // Handle mouse moving events.
  const handleMouseEnter = () => hoverLayerRef.current!.setIsHover(true)
  const handleMouseLeave = () => hoverLayerRef.current!.setIsHover(false)
  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
    // Position the hover indicator.
    hoverLayerRef.current!.updateMouse(e.clientX, e.clientY)
  }

  function handleContainerScroll() {
    // Update the offset of the hover layer.
    hoverLayerRef.current!.updateOffset(containerRef.current!.scrollTop)
  }

  // Handle scroll event.
  useEffect(() => {
    const sub = waveformScroll.subscribe(({ top }) => {
      containerRef.current!.scrollTo({ top, behavior: 'smooth' })
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
      <div
        ref={canvasContainerRef}
        className="relative overflow-hidden"
        style={{ marginBlock: marginBlock }}
      />

      <VirtualMarks />

      <div
        ref={currentIndicatorRef}
        className="absolute inset-x-0 z-30 border-t border-blue-500"
      />

      {addMarkContext && (
        <div
          className="absolute inset-x-0 z-40 border-t border-amber-500"
          style={{ top: addMarkContext.startHeight }}
        />
      )}

      <HoverLayer ref={hoverLayerRef} />
    </div>
  )
})
