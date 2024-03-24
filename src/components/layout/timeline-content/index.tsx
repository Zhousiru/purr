import {
  setEditorScroll,
  subEditorScroll,
  useWaveformHeightValue,
} from '@/atoms/editor'
import { useEffect, useRef } from 'react'

export function TimelineContent() {
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
      className="absolute inset-0 overflow-y-scroll"
      ref={containerRef}
      onScroll={handleContainerScroll}
    >
      <div style={{ height: waveformHeight }}>233</div>
    </div>
  )
}
