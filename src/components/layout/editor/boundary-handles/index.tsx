import {
  useCardPositionsValue,
  useDataMapValue,
  useDragLimitYValue,
  useDraggingRowIdValue,
  useHoveredRowIdValue,
  useWaveformColumnWidthValue,
  useWaveformVisibleAreaValue,
} from '@/atoms/editor'
import { cardOverscanHeight } from '@/constants/editor'
import { IconGripHorizontal } from '@tabler/icons-react'
import { RefObject, useMemo } from 'react'
import { computeBoundaries } from './compute-boundaries'
import { useBoundaryDrag } from './use-boundary-drag'

type BoundaryHandlesProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function BoundaryHandles({ scrollContainerRef }: BoundaryHandlesProps) {
  const dataMap = useDataMapValue()
  const cardPositions = useCardPositionsValue()
  const waveformWidth = useWaveformColumnWidthValue()
  const visibleArea = useWaveformVisibleAreaValue()

  const dragLimitY = useDragLimitYValue()
  const draggingRowId = useDraggingRowIdValue()
  const hoveredId = useHoveredRowIdValue()
  const { onPointerDown } = useBoundaryDrag(scrollContainerRef)

  const boundaries = useMemo(() => {
    if (dataMap.size === 0) return []
    return computeBoundaries(cardPositions, dataMap)
  }, [cardPositions, dataMap])

  const visibleBoundaries = useMemo(() => {
    const start = visibleArea.startY - cardOverscanHeight
    const end = visibleArea.endY + cardOverscanHeight
    return boundaries.filter((b) => b.y >= start && b.y <= end)
  }, [boundaries, visibleArea])

  if (dataMap.size === 0 || waveformWidth === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {dragLimitY >= 0 && (
        <div
          className="border-accent/50 absolute inset-x-0 border-t border-dashed"
          style={{ top: dragLimitY }}
        />
      )}
      {visibleBoundaries.map((boundary) => {
        const active =
          hoveredId === boundary.id || draggingRowId === boundary.id
        if (!active) return null

        if (boundary.type === 'start')
          return (
            <div
              key={`start-${boundary.id}`}
              className="bg-accent text-accent-foreground pointer-events-auto absolute flex h-2 w-5 -translate-x-1/2 cursor-ns-resize items-center justify-center opacity-75 hover:opacity-100"
              style={{
                top: boundary.y,
                left: waveformWidth,
                clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
              }}
              onPointerDown={(e) => onPointerDown(e, boundary)}
            >
              <svg className="h-full w-2" viewBox="0 0 8 8">
                <line
                  x1="0"
                  y1="3"
                  x2="8"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="5"
                  x2="8"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )

        if (boundary.type === 'end')
          return (
            <div
              key={`end-${boundary.id}`}
              className="bg-accent text-accent-foreground pointer-events-auto absolute flex h-2 w-5 -translate-x-1/2 -translate-y-full cursor-ns-resize items-center justify-center opacity-75 hover:opacity-100"
              style={{
                top: boundary.y,
                left: waveformWidth,
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
              }}
              onPointerDown={(e) => onPointerDown(e, boundary)}
            >
              <svg className="h-full w-2" viewBox="0 0 8 8">
                <line
                  x1="0"
                  y1="3"
                  x2="8"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="5"
                  x2="8"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )

        return (
          <div
            key={`move-${boundary.id}`}
            className="bg-accent text-accent-foreground pointer-events-auto absolute flex h-2.5 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center opacity-75 hover:opacity-100"
            style={{ top: boundary.y, left: waveformWidth }}
            onPointerDown={(e) => onPointerDown(e, boundary)}
          >
            <IconGripHorizontal size={11} />
          </div>
        )
      })}
    </div>
  )
}
