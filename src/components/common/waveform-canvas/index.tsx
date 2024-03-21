'use client'

import {
  setWaveformHeight,
  setWaveformScroll,
  subWaveformScroll,
} from '@/atoms/waveform'
import { mergeRefs } from '@/lib/utils/merge-refs'
import { Waveform } from '@/lib/waveform'
import { forwardRef, useEffect, useRef } from 'react'

const resolution = 15

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
        blockDuration: 10,
        mergeChannels,
        preload: 15,
        resolution,
        fillColor: {
          r: 107,
          g: 114,
          b: 128,
        },
      },
      {
        onSizeUpdate(_, h) {
          setWaveformHeight(h + 200) // Add the `margin-block` value.
        },
      },
    )
    waveformRef.current!.load(path)

    return () => {
      waveformRef.current!.dispose()
      waveformRef.current = null
    }
  }, [mergeChannels, path])

  useEffect(() => {
    containerRef.current!.scrollTo({ top: 0 })
  }, [path])

  const isControlledScroll = useRef(false)
  useEffect(
    () =>
      subWaveformScroll('waveform', (top) => {
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
    setWaveformScroll('waveform', containerRef.current!.scrollTop)
  }

  return (
    <div
      ref={mergeRefs([containerRef, ref])}
      className="scrollbar-none absolute inset-x-8 inset-y-0 overflow-y-auto"
      onScroll={handleContainerScroll}
    >
      <canvas ref={canvasRef} className="my-[100px]" />
    </div>
  )
})
