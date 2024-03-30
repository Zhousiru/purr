import {
  setContentScroll,
  subContentScroll,
  useCurrentEditingTask,
} from '@/atoms/editor'
import { virtualTextOverscan } from '@/constants/editor'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { TextCard } from './TextCard'
import { getTextCardHeight } from './utils'

export function TimelineContent() {
  const [task, setTask] = useCurrentEditingTask()
  if (!task.result) {
    throw new Error('Task does not have result yet.')
  }

  const containerRef = useRef<HTMLDivElement>(null)

  const isControlledScroll = useRef(false)
  useEffect(
    () =>
      subContentScroll((top) => {
        isControlledScroll.current = true
        containerRef.current!.scrollTop = top
        requestAnimationFrame(() => {
          isControlledScroll.current = false
        })
      }),
    [],
  )
  function handleContainerScroll() {
    if (!isControlledScroll.current) {
      setContentScroll(containerRef.current!.scrollTop)
    }
  }

  const rowVirtualizer = useVirtualizer({
    count: task.result.data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => getTextCardHeight(task.type === 'transcribe' ? 1 : 2),
    gap: 16,
    paddingStart: 16,
    paddingEnd: 16,
    overscan: virtualTextOverscan,
  })

  return (
    <div
      className="absolute inset-0 overflow-y-scroll"
      ref={containerRef}
      onScroll={handleContainerScroll}
    >
      <div
        className="relative overflow-hidden"
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {task.type === 'transcribe' && (
          <>
            {rowVirtualizer.getVirtualItems().map((item) => (
              <TextCard
                key={`${task.result!.data[item.index].start}${task.result!.data[item.index].end}${task.result!.data[item.index].text}`}
                start={task.result!.data[item.index].start}
                end={task.result!.data[item.index].end}
                line={1}
                className="absolute inset-x-4"
                style={{
                  top: item.start,
                }}
              >
                <div>{task.result!.data[item.index].text}</div>
              </TextCard>
            ))}
          </>
        )}

        {task.type === 'translate' && (
          <>
            {rowVirtualizer.getVirtualItems().map((item) => (
              <TextCard
                key={`${task.result!.data[item.index].start}${task.result!.data[item.index].end}${task.result!.data[item.index].text}`}
                start={task.result!.data[item.index].start}
                end={task.result!.data[item.index].end}
                line={1}
                className="absolute inset-x-4"
                style={{
                  top: item.start,
                }}
              >
                <div>{task.result!.data[item.index].text}</div>
                <div>{task.result!.data[item.index].translated}</div>
              </TextCard>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
