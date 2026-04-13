import {
  getCardPositions,
  getWaveformViewportHeight,
  setActiveRowIndex,
  useActiveRowIndexValue,
  useCurrentEditingTask,
  useHoveredRowIndexValue,
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
  const activeIndex = useActiveRowIndexValue()
  const hoveredIndex = useHoveredRowIndexValue()

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
  function handleCardFocus(index: number) {
    if (isFollowMode) return

    setActiveRowIndex(index)
    const card = getCardPositions()[index]
    if (card) {
      const centerY = card.top + card.height / 2
      const top = centerY - getWaveformViewportHeight() / 2
      waveformScroll.next({ top, behavior: 'smooth' })
    }
  }
  function handleCardBlur() {
    if (isFollowMode) return

    setActiveRowIndex(-1)
  }

  // Edit text card content.
  function updateText(
    index: number,
    type: 'text' | 'translated',
    newText: string,
  ) {
    setTask((prev) =>
      produce(prev, (draft) => {
        if (!draft.result) {
          throw new Error('Task does not have result yet.')
        }

        if (draft.type === 'transcribe') {
          if (type === 'translated') {
            throw new Error('Cannot edit `translated` of a `transcribe` task.')
          }
          draft.result.data[index].text = newText
        } else {
          if (type === 'text') {
            draft.result.data[index].text = newText
          } else {
            draft.result.data[index].translated = newText
          }
        }
      }),
    )
  }

  const hasEmphasis = activeIndex !== -1 || hoveredIndex !== -1

  return (
    <div className="absolute inset-0" ref={containerRef}>
      {visibleCards.map((card) => {
        const isEmphasized =
          activeIndex === card.index || hoveredIndex === card.index
        return (
          <TextCard
            key={`${card.index}${result.data[card.index].start}${result.data[card.index].end}`}
            start={result.data[card.index].start}
            end={result.data[card.index].end}
            className={cn(
              'absolute inset-x-4',
              hasEmphasis && !isEmphasized && 'opacity-50',
            )}
            style={{
              top: card.top,
              height: card.height,
            }}
            onFocus={() => handleCardFocus(card.index)}
            onBlur={() => handleCardBlur()}
          >
            <textarea
              value={result.data[card.index].text}
              onChange={(e) => updateText(card.index, 'text', e.target.value)}
              className="border-accent scrollbar-none field-sizing-content w-full resize-none bg-transparent outline-none focus:border-b"
            />
            {task.type === 'translate' && (
              <textarea
                value={(result as TranslateResult).data[card.index].translated}
                onChange={(e) =>
                  updateText(card.index, 'translated', e.target.value)
                }
                className="border-accent scrollbar-none field-sizing-content w-full resize-none bg-transparent outline-none focus:border-b"
              />
            )}
          </TextCard>
        )
      })}
    </div>
  )
}
