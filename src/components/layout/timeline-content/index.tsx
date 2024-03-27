import {
  setEditorScroll,
  subEditorScroll,
  useWaveformHeightValue,
} from '@/atoms/editor'
import { useEffect, useRef } from 'react'

export function TimelineContent({ leftOffset }: { leftOffset: number }) {
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
        <div
          className="absolute inset-x-0 border-y border-amber-500 bg-amber-500/5"
          style={{
            top: 300,
            height: 200,
          }}
        />
      </div>

      <div
        className="pointer-events-auto absolute right-0"
        style={{ height: waveformHeight, left: leftOffset }}
      >
        <div
          className="absolute inset-x-0 border-y border-amber-500 bg-amber-500/5 p-2"
          style={{
            top: 300,
            height: 200,
          }}
        >
          test
        </div>
      </div>
    </div>
  )
}
