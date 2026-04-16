import { CardPosition } from '@/atoms/editor'
import { Transcript } from '@/types/tasks'

export type BoundaryHandle = {
  y: number
  time: number
  type: 'start' | 'end' | 'move'
  id: string // subtitle UUID this handle controls
}

export function computeBoundaries(
  positions: CardPosition[],
  dataMap: ReadonlyMap<string, Transcript>,
): BoundaryHandle[] {
  if (positions.length === 0) return []

  const boundaries: BoundaryHandle[] = []

  for (const card of positions) {
    const d = dataMap.get(card.id)
    if (!d) continue
    boundaries.push({
      time: d.start,
      y: card.top,
      type: 'start',
      id: card.id,
    })
    boundaries.push({
      time: d.end,
      y: card.top + card.height,
      type: 'end',
      id: card.id,
    })
    boundaries.push({
      time: (d.start + d.end) / 2,
      y: card.top + card.height / 2,
      type: 'move',
      id: card.id,
    })
  }

  return boundaries
}
