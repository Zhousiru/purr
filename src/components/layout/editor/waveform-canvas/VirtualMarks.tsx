import {
  useCurrentEditingTaskValue,
  useWaveformViewportHeightValue,
  useWaveformVisibleAreaValue,
} from '@/atoms/editor'
import { virtualMarksOverscanHeight } from '@/constants/editor'
import { cn } from '@/lib/utils/cn'
import { markHighlight, textHighlight, waveformScroll } from '@/subjects/editor'
import { useEffect, useState } from 'react'
import { seekHeight } from './utils'

export function VirtualMarks() {
  const task = useCurrentEditingTaskValue()

  const visibleArea = useWaveformVisibleAreaValue()
  const waveformHeight = useWaveformViewportHeightValue()

  const totalMarks = (task.result?.data ?? []).map(
    (d, index) => [index, seekHeight(d.start), seekHeight(d.end)] as const,
  )

  const startWithOverscan = visibleArea.startY - virtualMarksOverscanHeight
  const endWithOverscan = visibleArea.endY + virtualMarksOverscanHeight

  const visibleMarks = totalMarks.filter(
    ([_, start, end]) =>
      (startWithOverscan <= start && endWithOverscan >= start) ||
      (startWithOverscan <= end && endWithOverscan >= end),
  )

  function handleSeekText(index: number) {
    const [_, start, end] = totalMarks[index]
    const centerHeight = (end - start) / 2 + start
    textHighlight.next({ index, to: centerHeight - visibleArea.startY })
  }

  const [highlightIndex, setHighlightIndex] = useState(-1)
  useEffect(() => {
    const sub = markHighlight.subscribe(({ index }) => {
      if (index === -1) {
        // Unhighlight only.
        setHighlightIndex(-1)
        return
      }

      const [_, start, end] = totalMarks[index]
      const height = end - start
      const centerHeight = start + height / 2
      const centerOffset = waveformHeight / 2
      const top = centerHeight - centerOffset

      console.log('VirtualMarks.SeekText', index)

      waveformScroll.next(top)
      setHighlightIndex(index)
    })

    return () => sub.unsubscribe()
  }, [totalMarks, visibleArea.endY, visibleArea.startY, waveformHeight])

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
}
