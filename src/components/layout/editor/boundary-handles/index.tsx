import {
  useCardPositionsValue,
  useDataMapValue,
  useDragLimitYValue,
  useHighlightedRowIdsValue,
  useHoveredRowIdValue,
  useWaveformColumnWidthValue,
  useWaveformVisibleAreaValue,
} from '@/atoms/editor'
import { cardOverscanHeight } from '@/constants/editor'
import { RefObject, useMemo } from 'react'
import { computeBoundaries } from './compute-boundaries'
import { useBoundaryDrag } from './use-boundary-drag'

const HANDLE_SIZE = 12

type BoundaryHandlesProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function BoundaryHandles({ scrollContainerRef }: BoundaryHandlesProps) {
  const dataMap = useDataMapValue()
  const cardPositions = useCardPositionsValue()
  const waveformWidth = useWaveformColumnWidthValue()
  const visibleArea = useWaveformVisibleAreaValue()

  const dragLimitY = useDragLimitYValue()
  const highlighted = useHighlightedRowIdsValue()
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
          className="border-accent/40 absolute inset-x-0 border-t border-dashed"
          style={{ top: dragLimitY }}
        />
      )}
      {visibleBoundaries.map((boundary) => {
        const active =
          highlighted.includes(boundary.id) || hoveredId === boundary.id
        if (!active) return null
        return (
        <div
          key={`${boundary.type}-${boundary.id}`}
          className={`bg-accent pointer-events-auto absolute rounded-sm opacity-70 hover:opacity-100 hover:shadow-md ${
            boundary.type === 'move' ? 'cursor-grab' : 'cursor-ns-resize'
          }`}
          style={{
            top:
              boundary.type === 'end'
                ? boundary.y - HANDLE_SIZE
                : boundary.y - (boundary.type === 'move' ? HANDLE_SIZE / 2 : 0),
            left: waveformWidth - HANDLE_SIZE / 2,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
          }}
          onPointerDown={(e) => onPointerDown(e, boundary)}
        />
        )
      })}
    </div>
  )
}
