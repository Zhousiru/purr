import {
  useDragInvalidIdValue,
  useDraggingRowIdValue,
  useHighlightedRowIdsValue,
  useHoveredRowIdValue,
  useIsFollowModeValue,
  useVisibleCardPositionsValue,
} from '@/atoms/editor'
import { cn } from '@/lib/utils/cn'

export function MarksLayer() {
  const visibleCards = useVisibleCardPositionsValue()
  const highlighted = useHighlightedRowIdsValue()
  const hoveredId = useHoveredRowIdValue()
  const isFollowMode = useIsFollowModeValue()
  const draggingRowId = useDraggingRowIdValue()
  const dragInvalidId = useDragInvalidIdValue()

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {visibleCards.map((card) => {
        const isHover = card.id === hoveredId
        const isHighlighted = highlighted.includes(card.id)
        const isDragging = card.id === draggingRowId
        const isDragInvalid = card.id === dragInvalidId
        const hasOtherHighlighted =
          highlighted.length > 0 && !isHighlighted
        return (
          <div
            key={card.id}
            className={cn(
              'absolute inset-x-0 border-y border-transparent',
              isDragInvalid
                ? 'border-accent/25 bg-accent/5'
                : (isDragging || isHighlighted ||
                      (!hasOtherHighlighted && !isFollowMode && isHover)) &&
                      'border-accent bg-accent/10',
            )}
            style={{
              top: card.top,
              height: card.height,
            }}
          />
        )
      })}
    </div>
  )
}
