import {
  useHighlightedRowsValue,
  useHoveredRowIndexValue,
  useIsFollowModeValue,
  useVisibleCardPositionsValue,
} from '@/atoms/editor'
import { cn } from '@/lib/utils/cn'

export function MarksLayer() {
  const visibleCards = useVisibleCardPositionsValue()
  const highlighted = useHighlightedRowsValue()
  const hoveredIndex = useHoveredRowIndexValue()
  const isFollowMode = useIsFollowModeValue()

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {visibleCards.map((card) => {
        const isHover = card.index === hoveredIndex
        const isHighlighted = highlighted.includes(card.index)
        const hasOtherHighlighted =
          highlighted.length > 0 && !isHighlighted
        return (
          <div
            key={card.index}
            className={cn(
              'absolute inset-x-0 border-y border-transparent',
              (isHighlighted ||
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
