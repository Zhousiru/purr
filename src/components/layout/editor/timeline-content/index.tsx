import { useCurrentEditingTask } from '@/atoms/editor'
import {
  virtualTextGap,
  virtualTextOverscan,
  virtualTextPaddingBlock,
} from '@/constants/editor'
import { cn } from '@/lib/utils/cn'
import { markHighlight, textHighlight } from '@/subjects/editor'
import { TranslateResult } from '@/types/tasks'
import { useVirtualizer } from '@tanstack/react-virtual'
import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'
import { TextCard } from './TextCard'
import { getTextCardHeight } from './utils'

export function TimelineContent() {
  const [task, setTask] = useCurrentEditingTask()

  const result = task.result
  if (!result) {
    throw new Error('Task does not have result yet.')
  }

  const containerRef = useRef<HTMLDivElement>(null)

  // Virtualize text cards.
  const line = task.type === 'transcribe' ? 1 : 2
  const cardHeight = getTextCardHeight(line)

  const rowVirtualizer = useVirtualizer({
    count: result.data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => cardHeight,
    gap: virtualTextGap,
    paddingStart: virtualTextPaddingBlock,
    paddingEnd: virtualTextPaddingBlock,
    overscan: virtualTextOverscan,
  })

  // Handle highlight event.
  const [highlightIndex, setHighlightIndex] = useState(-1)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const sub = textHighlight.subscribe(({ index, to }) => {
      const centerHeight =
        index * (cardHeight + virtualTextGap) +
        virtualTextPaddingBlock +
        cardHeight / 2
      rowVirtualizer.scrollToOffset(centerHeight - to, { behavior: 'smooth' })

      setHighlightIndex(index)

      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        setHighlightIndex(-1)
        timer = null
      }, 1000)
    })

    return () => sub.unsubscribe()
  }, [cardHeight, rowVirtualizer])

  // Handle accessible keyboard event.
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const focused = document.activeElement
        if (!containerRef.current!.contains(focused)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        if (focused instanceof HTMLElement) {
          focused.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  })

  // Active text card.
  const [activeIndex, setActiveIndex] = useState(-1)
  function handleCardFocus(index: number) {
    setActiveIndex(index)

    const height =
      index * (cardHeight + virtualTextGap) + virtualTextPaddingBlock
    const centerHeight = height + cardHeight / 2
    const centerOffset = containerRef.current!.offsetHeight / 2
    const top = centerHeight - centerOffset

    containerRef.current!.scrollTo({ top, behavior: 'smooth' })

    markHighlight.next({
      index,
    })
  }
  function handleCardBlur() {
    setActiveIndex(-1)
    markHighlight.next({ index: -1 })
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

  return (
    <div className="absolute inset-0 overflow-y-scroll" ref={containerRef}>
      <div
        className="relative overflow-hidden"
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {rowVirtualizer.getVirtualItems().map((item) => (
          <TextCard
            key={`${item.key}${result.data[item.index].start}${result.data[item.index].end}`}
            start={result.data[item.index].start}
            end={result.data[item.index].end}
            className={cn(
              'absolute inset-x-4 transition',
              activeIndex !== -1 && activeIndex !== item.index && 'opacity-50',
              activeIndex === item.index && 'ring-2 ring-amber-500',
              highlightIndex === item.index && 'bg-amber-100',
            )}
            style={{
              top: item.start,
              height: cardHeight,
            }}
            onFocus={() => handleCardFocus(item.index)}
            onBlur={() => handleCardBlur()}
          >
            <input
              type="text"
              value={result.data[item.index].text}
              onChange={(e) => updateText(item.index, 'text', e.target.value)}
              className="w-full overflow-hidden text-ellipsis whitespace-nowrap border-amber-500 bg-transparent outline-none focus:border-b"
            />
            {task.type === 'translate' && (
              <input
                type="text"
                value={(result as TranslateResult).data[item.index].translated}
                onChange={(e) =>
                  updateText(item.index, 'translated', e.target.value)
                }
                className="w-full overflow-hidden text-ellipsis whitespace-nowrap border-amber-500 bg-transparent outline-none focus:border-b"
              />
            )}
          </TextCard>
        ))}
      </div>
    </div>
  )
}
