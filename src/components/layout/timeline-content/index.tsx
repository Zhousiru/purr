import { useCurrentEditingTask } from '@/atoms/editor'
import { virtualTextOverscan } from '@/constants/editor'
import { cn } from '@/lib/utils/cn'
import { textScrollTo } from '@/subjects/editor'
import { TranslateResult } from '@/types/tasks'
import { useVirtualizer } from '@tanstack/react-virtual'
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

  // const isControlledScroll = useRef(false)
  // useEffect(
  //   () =>
  //     subContentScroll((top) => {
  //       isControlledScroll.current = true
  //       containerRef.current!.scrollTop = top
  //       requestAnimationFrame(() => {
  //         isControlledScroll.current = false
  //       })
  //     }),
  //   [],
  // )
  // function handleContainerScroll() {
  //   if (!isControlledScroll.current) {
  //     setContentScroll(containerRef.current!.scrollTop)
  //   }
  // }

  const line = task.type === 'transcribe' ? 1 : 2
  const rowVirtualizer = useVirtualizer({
    count: result.data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => getTextCardHeight(line),
    gap: 16,
    paddingStart: 16,
    paddingEnd: 16,
    overscan: virtualTextOverscan,
  })

  const [highlightIndex, setHighlightIndex] = useState(-1)
  useEffect(() => {
    const sub = textScrollTo.subscribe((index) => {
      rowVirtualizer.scrollToIndex(index, { behavior: 'smooth' })
      setHighlightIndex(index)
      setTimeout(() => {
        setHighlightIndex(-1)
      }, 1000)
    })

    return () => sub.unsubscribe()
  }, [rowVirtualizer])

  return (
    <div
      className="absolute inset-0 overflow-y-scroll"
      ref={containerRef}
      // onScroll={handleContainerScroll}
    >
      <div
        className="relative overflow-hidden"
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {rowVirtualizer.getVirtualItems().map((item) => (
          <TextCard
            key={`${result.data[item.index].start}${result.data[item.index].end}${result.data[item.index].text}`}
            start={result.data[item.index].start}
            end={result.data[item.index].end}
            line={line}
            className={cn(
              'absolute inset-x-4 transition',
              highlightIndex === item.index && 'ring-2 ring-amber-500',
            )}
            style={{
              top: item.start,
            }}
          >
            <div>{result.data[item.index].text}</div>
            {task.type === 'translate' && (
              <div>
                {(result as TranslateResult).data[item.index].translated}
              </div>
            )}
          </TextCard>
        ))}
      </div>
    </div>
  )
}
