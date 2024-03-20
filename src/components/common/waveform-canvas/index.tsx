'use client'

import { Waveform } from '@/lib/waveform'
import { useEffect, useRef } from 'react'

export function WaveformCanvas({
  path,
  mergeChannels,
}: {
  path: string
  mergeChannels: boolean
}) {
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
        resolution: 15,
        fillColor: {
          r: 107,
          g: 114,
          b: 128,
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

  return (
    <>
      <div className="relative flex-grow">
        <div
          ref={containerRef}
          className="scrollbar-none absolute inset-0 overflow-y-auto"
        >
          <canvas ref={canvasRef} className="my-[100px]" />
        </div>
      </div>
    </>
  )
}
