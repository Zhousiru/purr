'use client'

import { useEffect, useRef } from 'react'

export function Waveform({ data }: { data: Float32Array }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dpr = window.devicePixelRatio

  useEffect(() => {
    const canvas = canvasRef.current!

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not supported.')

    const width = canvas.width
    const height = canvas.height
    const xCenter = width / 2

    const fillColor = {
      r: 107,
      g: 114,
      b: 128,
    }

    const imageData = ctx.createImageData(width, height)
    for (let y = 0; y < data.length / 2; y++) {
      const maxX = Math.floor(xCenter + (data[2 * y] * width) / 2)
      const minX = Math.floor(xCenter + (data[2 * y + 1] * width) / 2)

      let startIndex = (y * imageData.width + minX) * 4
      let endIndex = (y * imageData.width + maxX) * 4

      for (let i = startIndex; i <= endIndex; i += 4) {
        imageData.data[i] = fillColor.r
        imageData.data[i + 1] = fillColor.g
        imageData.data[i + 2] = fillColor.b

        // Fake aliasing effect.
        if (maxX !== minX && (i === startIndex || i === endIndex)) {
          imageData.data[i + 3] = 180
        } else {
          imageData.data[i + 3] = 255
        }
      }
    }
    ctx.putImageData(imageData, 0, 0)

    return () => ctx.clearRect(0, 0, width, height)
  }, [data, dpr])

  return (
    <>
      <div className="scrollbar-none relative flex-grow overflow-y-auto">
        <canvas
          ref={canvasRef}
          width={350 * dpr}
          height={data.length / 2}
          style={{ width: 350, height: data.length / 2 / dpr }}
          className="absolute inset-x-0 top-0"
        />
      </div>
    </>
  )
}
