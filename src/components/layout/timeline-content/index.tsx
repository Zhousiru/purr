import {
  setContentScroll,
  subContentScroll,
  useCurrentEditingTask,
  useWaveformHeightValue,
} from '@/atoms/editor'
import { useEffect, useRef } from 'react'

export function TimelineContent({ leftOffset }: { leftOffset: number }) {
  const [task, setTask] = useCurrentEditingTask()

  const waveformHeight = useWaveformHeightValue()
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

  return (
    <div
      className="absolute inset-0 overflow-y-scroll"
      ref={containerRef}
      onScroll={handleContainerScroll}
    >
      {/* TODO: To be rewritten. */}
    </div>
  )
}
