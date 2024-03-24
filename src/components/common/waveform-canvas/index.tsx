'use client'

import {
  setCurrentAudioDuration,
  setEditorScroll,
  setWaveformCanvasHeight,
  subEditorScroll,
} from '@/atoms/editor'
import {
  blockDuration,
  fillColor,
  marginBlock,
  preload,
  resolution,
  widthScale,
} from '@/constants/waveform'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { mergeRefs } from '@/lib/utils/merge-refs'
import { Waveform } from '@/lib/waveform'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import {
  MouseEventHandler,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react'
import { seekHeight, seekTime } from './utils'

export const WaveformCanvas = forwardRef<
  HTMLDivElement,
  {
    path: string
    mergeChannels: boolean
  }
>(function WaveformCanvas({ path, mergeChannels }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveformRef = useRef<Waveform | null>(null)
  useEffect(() => {
    waveformRef.current = new Waveform(
      containerRef.current!,
      canvasRef.current!,
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
        onSizeUpdate(_, h) {
          setWaveformCanvasHeight(h)
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

  // Position the fixed layer.
  // We place hover indicator in a fixed layer to avoid lag while scrolling.
  const hoverContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const rect = containerRef.current!.getBoundingClientRect()
      hoverContainerRef.current!.style.top = rect.top + 'px'
      hoverContainerRef.current!.style.left = rect.left + 'px'
      hoverContainerRef.current!.style.width = rect.width + 'px'
      hoverContainerRef.current!.style.height = rect.height + 'px'
    })
    observer.observe(containerRef.current!)

    return () => observer.disconnect()
  })

  // Position the hover indicator.
  const hoverIndicatorRef = useRef<HTMLDivElement>(null)
  const [showHoverIndicator, setShowHoverIndicator] = useState(false)
  const handleMouseEnter = () => setShowHoverIndicator(true)
  const handleMouseLeave = () => setShowHoverIndicator(false)
  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (ev) => {
    const height =
      ev.clientY - containerRef.current!.getBoundingClientRect().top
    hoverIndicatorRef.current!.style.top = height + 'px'
  }

  const handleSeek: MouseEventHandler<HTMLButtonElement> = (ev) => {
    const height =
      ev.clientY -
      containerRef.current!.getBoundingClientRect().top +
      containerRef.current!.scrollTop

    player.seek(seekTime(height))
    player.play()
  }

  // Sync `scrollTop`.
  const isControlledScroll = useRef(false)
  useEffect(
    () =>
      subEditorScroll('waveform', (top) => {
        isControlledScroll.current = true
        containerRef.current!.scrollTop = top
        requestAnimationFrame(() => {
          isControlledScroll.current = false
        })
      }),
    [],
  )
  function handleContainerScroll() {
    if (isControlledScroll.current) {
      return
    }
    setEditorScroll('waveform', containerRef.current!.scrollTop)
  }

  return (
    <div
      ref={mergeRefs([containerRef, ref])}
      className="scrollbar-none absolute inset-0 overflow-y-auto"
      onScroll={handleContainerScroll}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        style={{ marginBlock }}
        className="mix-blend-multiply"
      />

      <div
        ref={currentIndicatorRef}
        className="absolute inset-x-0 z-40 border-t border-blue-500"
      />

      <div ref={hoverContainerRef} className="pointer-events-none fixed z-50">
        <div
          ref={hoverIndicatorRef}
          className={cn(
            'absolute inset-x-0',
            !showHoverIndicator && 'opacity-0',
          )}
        >
          <div className="border-t border-dashed border-blue-500" />
          <button
            className={cn(
              'absolute right-6 -translate-y-1/2 rounded-md bg-blue-500 px-2 py-1',
              showHoverIndicator && 'pointer-events-auto',
            )}
            onClick={handleSeek}
          >
            <IconPlayerPlayFilled size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
})
