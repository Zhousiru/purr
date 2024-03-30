'use client'

import {
  setCurrentAudioDuration,
  setWaveformScroll,
  subWaveformScroll,
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
import {
  MouseEventHandler,
  ReactNode,
  forwardRef,
  useEffect,
  useRef,
} from 'react'
import { HoverLayer, HoverLayerRef } from './HoverLayer'
import { VirtualMarks, VirtualMarksRef } from './VirtualMarks'
import { seekHeight } from './utils'

export const WaveformCanvas = forwardRef<
  HTMLDivElement,
  {
    path: string
    mergeChannels: boolean
    children?: ReactNode
  }
>(function WaveformCanvas({ path, mergeChannels, children }, ref) {
  // Bind `Waveform`.
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<Waveform | null>(null)

  const virtualMarksRef = useRef<VirtualMarksRef>(null)

  useEffect(() => {
    waveformRef.current = new Waveform(
      containerRef.current!,
      canvasContainerRef.current!,
      {
        blockDuration,
        mergeChannels,
        preload,
        resolution,
        fillColor,
        widthScale,
      },
      {
        onLoaded(duration) {
          setCurrentAudioDuration(duration)
        },
        onContainerVisibleAreaUpdate(startY, endY) {
          // Update visible area of virtual marks.
          virtualMarksRef.current!.updateVisibleArea(startY, endY)
        },
      },
    )
    waveformRef.current!.load(path)

    return () => {
      waveformRef.current!.dispose()
      waveformRef.current = null
    }
  }, [mergeChannels, path])

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
  const hoverLayerRef = useRef<HoverLayerRef>(null)
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      hoverLayerRef.current!.updateBounding(
        containerRef.current!.getBoundingClientRect(),
      )
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

  // Sync `scrollTop`.
  const isControlledScroll = useRef(false)
  useEffect(
    () =>
      subWaveformScroll((top) => {
        isControlledScroll.current = true
        containerRef.current!.scrollTop = top
        requestAnimationFrame(() => {
          isControlledScroll.current = false
        })
      }),
    [],
  )
  function handleContainerScroll() {
    if (!isControlledScroll.current) {
      setWaveformScroll(containerRef.current!.scrollTop)
    }

    // Update the offset of the hover layer.
    hoverLayerRef.current!.updateOffset(containerRef.current!.scrollTop)
  }

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

      {children}
      <VirtualMarks ref={virtualMarksRef} />

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
