import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { virtualMarksOverscan } from '@/constants/editor'
import { cn } from '@/lib/utils/cn'
import { markHighlight, textHighlight, waveformScroll } from '@/subjects/editor'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { seekHeight } from './utils'

export interface VirtualMarksRef {
  updateVisibleArea: (start: number, end: number) => void
}

export const VirtualMarks = forwardRef<VirtualMarksRef>(function VirtualMarks(
  {},
  ref,
) {
  const task = useCurrentEditingTaskValue()

  const [visibleArea, setVisibleArea] = useState<{
    start: number
    end: number
  }>({
    start: 0,
    end: 0,
  })

  useImperativeHandle(
    ref,
    () => ({
      updateVisibleArea(start: number, end: number) {
        setVisibleArea({ start, end })
      },
    }),
    [],
  )

  const totalMarks = (task.result?.data ?? []).map(
    (d, index) => [index, seekHeight(d.start), seekHeight(d.end)] as const,
  )

  const startWithOverscan = visibleArea.start - virtualMarksOverscan
  const endWithOverscan = visibleArea.end + virtualMarksOverscan

  const visibleMarks = totalMarks.filter(
    ([_, start, end]) =>
      (startWithOverscan <= start && endWithOverscan >= start) ||
      (startWithOverscan <= end && endWithOverscan >= end),
  )

  function handleSeekText(index: number) {
    textHighlight.next({ index, to: totalMarks[index][1] - visibleArea.start })
  }

  const [highlightIndex, setHighlightIndex] = useState(-1)
  useEffect(() => {
    const sub = markHighlight.subscribe(({ index, to }) => {
      if (index === -1) {
        // Unhighlight only.
        setHighlightIndex(-1)
        return
      }

      const markStart = totalMarks[index][1]
      waveformScroll.next(markStart - to)
      setHighlightIndex(index)
    })

    return () => sub.unsubscribe()
  }, [totalMarks])

  return (
    <>
      {visibleMarks.map(([index, start, end]) => (
        <div
          key={`${index}${start}${end}`}
          className={cn(
            'absolute inset-x-0 cursor-pointer border-y border-amber-500 bg-amber-500/5 transition hover:bg-amber-500/10',
            highlightIndex !== -1 && highlightIndex !== index && 'opacity-25',
            highlightIndex === index && 'bg-amber-500/10',
          )}
          role="button"
          onClick={() => handleSeekText(index)}
          style={{
            top: start,
            height: end - start,
          }}
        />
      ))}
    </>
  )
})
