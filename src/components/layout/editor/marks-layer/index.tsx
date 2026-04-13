import {
  useActiveRowIndexValue,
  useHoveredRowIndexValue,
  useIsFollowModeValue,
  useVisibleCardPositionsValue,
} from '@/atoms/editor'
import { cn } from '@/lib/utils/cn'

export function MarksLayer() {
  const visibleCards = useVisibleCardPositionsValue()
  const activeIndex = useActiveRowIndexValue()
  const hoveredIndex = useHoveredRowIndexValue()
  const isFollowMode = useIsFollowModeValue()

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {visibleCards.map((card) => {
        const isHover = card.index === hoveredIndex
        const isActive = card.index === activeIndex
        const hasOtherActive = activeIndex !== -1 && activeIndex !== card.index
        return (
          <div
            key={card.index}
            className={cn(
              'absolute inset-x-0 border-y border-transparent',
              (isActive || (!hasOtherActive && !isFollowMode && isHover)) &&
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
