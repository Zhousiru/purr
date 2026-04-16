import { CardPosition } from '@/atoms/editor'
import { Transcript } from '@/types/tasks'

export type BoundaryHandle = {
  y: number
  time: number
  type: 'start' | 'end' | 'move'
  index: number // card index this handle controls
}

export function computeBoundaries(
  positions: CardPosition[],
  data: Transcript[],
): BoundaryHandle[] {
  if (positions.length === 0) return []

  const boundaries: BoundaryHandle[] = []

  for (const card of positions) {
    const d = data[card.index]
    if (!d) continue
    boundaries.push({
      time: d.start,
      y: card.top,
      type: 'start',
      index: card.index,
    })
    boundaries.push({
      time: d.end,
      y: card.top + card.height,
      type: 'end',
      index: card.index,
    })
    boundaries.push({
      time: (d.start + d.end) / 2,
      y: card.top + card.height / 2,
      type: 'move',
      index: card.index,
    })
  }

  return boundaries
}
