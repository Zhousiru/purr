import {
  getCardPositions,
  getWaveformViewportHeight,
  setHighlightedRowIds,
  useCurrentEditingTask,
  useDataMapValue,
  useDragInvalidIdValue,
  useHighlightedRowIdsValue,
  useHoveredRowIdValue,
  useIsFollowModeValue,
  useVisibleCardPositionsValue,
} from '@/atoms/editor'
import { cn } from '@/lib/utils/cn'
import { waveformScroll } from '@/subjects/editor'
import { TranslateResult } from '@/types/tasks'
import { produce } from 'immer'
import { useEffect, useRef } from 'react'
import { TextCard } from './TextCard'

export function TimelineContent() {
  const [task, setTask] = useCurrentEditingTask()

  const result = task.result
  if (!result) {
    throw new Error('Task does not have result yet.')
  }

  const isFollowMode = useIsFollowModeValue()

  const visibleCards = useVisibleCardPositionsValue()
  const dataMap = useDataMapValue()
  const highlighted = useHighlightedRowIdsValue()
  const hoveredId = useHoveredRowIdValue()
  const dragInvalidId = useDragInvalidIdValue()

  // Handle accessible keyboard event.
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const focused = document.activeElement
        if (!containerRef.current!.contains(focused)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        if (focused instanceof HTMLElement && !isFollowMode) {
          focused.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isFollowMode])

  // Active text card.
  function handleCardFocus(id: string) {
    if (isFollowMode) return

    setHighlightedRowIds([id])
    const card = getCardPositions().find((c) => c.id === id)
    if (card) {
      const centerY = card.top + card.height / 2
      const top = centerY - getWaveformViewportHeight() / 2
      waveformScroll.next({ top, behavior: 'smooth' })
    }
  }
  function handleCardBlur() {
    if (isFollowMode) return

    setHighlightedRowIds([])
  }

  // Edit text card content.
  function updateText(id: string, type: 'text' | 'translated', newText: string) {
    setTask((prev) =>
      produce(prev, (draft) => {
        if (!draft.result) {
          throw new Error('Task does not have result yet.')
        }

        const item = draft.result.data.find((d) => d.id === id)
        if (!item) return

        if (draft.type === 'transcribe') {
          if (type === 'translated') {
            throw new Error('Cannot edit `translated` of a `transcribe` task.')
          }
          item.text = newText
        } else {
          if (type === 'text') {
            item.text = newText
          } else {
            ;(item as { translated: string }).translated = newText
          }
        }
      }),
    )
  }

  const hasEmphasis = highlighted.length > 0 || hoveredId !== null

  return (
    <div className="absolute inset-0" ref={containerRef}>
      {visibleCards.map((card) => {
        const d = dataMap.get(card.id)
        if (!d) return null
        const isEmphasized =
          highlighted.includes(card.id) || hoveredId === card.id
        return (
          <TextCard
            key={card.id}
            start={d.start}
            end={d.end}
            className={cn(
              'absolute inset-x-4',
              card.id === dragInvalidId
                ? 'opacity-25'
                : hasEmphasis && !isEmphasized && 'opacity-50',
            )}
            style={{
              top: card.top,
              height: card.height,
            }}
            onFocus={() => handleCardFocus(card.id)}
            onBlur={() => handleCardBlur()}
          >
            <textarea
              value={d.text}
              onChange={(e) => updateText(card.id, 'text', e.target.value)}
              className="border-accent scrollbar-none field-sizing-content w-full resize-none bg-transparent outline-none focus:border-b"
              autoComplete="off"
            />
            {task.type === 'translate' && (
              <textarea
                value={
                  (result as TranslateResult).data.find(
                    (t) => t.id === card.id,
                  )?.translated ?? ''
                }
                onChange={(e) =>
                  updateText(card.id, 'translated', e.target.value)
                }
                className="border-accent scrollbar-none field-sizing-content w-full resize-none bg-transparent outline-none focus:border-b"
                autoComplete="off"
              />
            )}
          </TextCard>
        )
      })}
    </div>
  )
}
