import {
  setEditorScroll,
  subEditorScroll,
  useCurrentEditingTask,
  useWaveformHeightValue,
} from '@/atoms/editor'
import { useEffect, useRef } from 'react'
import { TimelineMarks } from './TimelineMarks'

export function TimelineContent({ leftOffset }: { leftOffset: number }) {
  const [task, setTask] = useCurrentEditingTask()

  const waveformHeight = useWaveformHeightValue()
  const containerRef = useRef<HTMLDivElement>(null)

  const isControlledScroll = useRef(false)
  useEffect(
    () =>
      subEditorScroll('timeline', (top) => {
        isControlledScroll.current = true
        containerRef.current!.scrollTop = top
        requestAnimationFrame(() => {
          isControlledScroll.current = false
        })
      }),
    [],
  )
  function handleContainerScroll() {
    if (isControlledScroll.current) {
      return
    }
    setEditorScroll('timeline', containerRef.current!.scrollTop)
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-y-scroll"
      ref={containerRef}
      onScroll={handleContainerScroll}
    >
      {/* Waveform overlay. */}
      <div
        className="absolute left-0"
        style={{ height: waveformHeight, width: leftOffset }}
      >
        {task.type === 'transcribe' && (
          <TimelineMarks.Overlay data={task.result?.transcript ?? []} />
        )}
        {task.type === 'translate' && (
          <TimelineMarks.Overlay data={task.result?.translation ?? []} />
        )}
      </div>

      <div
        className="pointer-events-auto absolute right-0"
        style={{ height: waveformHeight, left: leftOffset }}
      >
        {task.type === 'transcribe' && (
          <TimelineMarks.Content data={task.result?.transcript ?? []} />
        )}
        {task.type === 'translate' && (
          <TimelineMarks.Content data={task.result?.translation ?? []} />
        )}
      </div>
    </div>
  )
}
