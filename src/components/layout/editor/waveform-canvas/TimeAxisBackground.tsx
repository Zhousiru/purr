import {
  useCurrentEditingAudioDurationValue,
  useWaveformViewportHeightValue,
  useWaveformVisibleAreaValue,
  useZoomLevelValue,
} from '@/atoms/editor'
import { resolution } from '@/constants/editor'
import { formatSec } from '@/lib/utils/time'
import { useMemo } from 'react'

const NICE_INTERVALS = [
  0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600,
] as const

const MIN_FINE_PX = 10

function chooseTickInterval(pxPerSec: number): number {
  for (const s of NICE_INTERVALS) {
    if (s * pxPerSec >= MIN_FINE_PX) return s
  }
  return NICE_INTERVALS[NICE_INTERVALS.length - 1]
}

type TickLevel = 'fine' | 'medium' | 'major'

type Tick = {
  i: number
  y: number
  level: TickLevel
  time: number
}

export function TimeAxisBackground() {
  const zoomLevel = useZoomLevelValue()
  const viewportHeight = useWaveformViewportHeightValue()
  const duration = useCurrentEditingAudioDurationValue()
  const { startY, endY } = useWaveformVisibleAreaValue()

  const ticks = useMemo<Tick[]>(() => {
    if (viewportHeight <= 0 || duration <= 0 || endY < 0) return []

    const pxPerSec = (resolution * zoomLevel) / window.devicePixelRatio
    const marginBlock = viewportHeight / 2
    const fineSec = chooseTickInterval(pxPerSec)
    const finePx = fineSec * pxPerSec
    if (finePx <= 0) return []

    const axisEndY = marginBlock + duration * pxPerSec
    const overscan = viewportHeight / 2
    const windowStart = Math.max(marginBlock, startY - overscan)
    const windowEnd = Math.min(axisEndY, endY + overscan)
    if (windowEnd <= windowStart) return []

    const totalTicks = Math.floor(duration / fineSec)
    const startIdx = Math.max(
      0,
      Math.ceil((windowStart - marginBlock) / finePx),
    )
    const endIdx = Math.min(
      totalTicks,
      Math.floor((windowEnd - marginBlock) / finePx),
    )

    const out: Tick[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      const time = i * fineSec
      const y = marginBlock + i * finePx
      const level: TickLevel =
        i % 10 === 0 ? 'major' : i % 5 === 0 ? 'medium' : 'fine'
      out.push({ i, y, level, time })
    }
    return out
  }, [zoomLevel, viewportHeight, duration, startY, endY])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {ticks.map(({ i, y, level, time }) => (
        <div
          key={i}
          className={
            level === 'major'
              ? 'border-foreground/10 absolute left-0 w-10 border-t'
              : level === 'medium'
                ? 'border-foreground/10 absolute left-0 w-6 border-t'
                : 'border-foreground/10 absolute left-0 w-2 border-t'
          }
          style={{ top: y }}
        >
          {level === 'major' && (
            <span className="text-muted-foreground/50 absolute -top-3 left-0.5 font-mono text-[9px]">
              {formatSec(time, false)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
