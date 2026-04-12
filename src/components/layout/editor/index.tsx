import {
  findRowIndexByY,
  setHoveredRowIndex,
  setWaveformViewportHeight,
  setWaveformVisibleArea,
  useCurrentEditingAudioDurationValue,
  useCurrentEditingAudioPathValue,
  useTotalHeightValue,
  useWaveformViewportHeightValue,
} from '@/atoms/editor'
import { WaveformCanvas } from '@/components/layout/editor/waveform-canvas'
import { usePointerInRect } from '@/hooks/usePointerInRect'
import { player } from '@/lib/player'
import { pointerMove, waveformScroll } from '@/subjects/editor'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { FloatController } from './float-controller'
import { FollowModeDispatcher } from './follow-mode-dispatcher'
import { MarksLayer } from './marks-layer'
import { PlaybackIndicator } from './playback-indicator'
import { TimelineContent } from './timeline-content'
import { HoverLayer, HoverLayerRef } from './waveform-canvas/HoverLayer'

export function Editor() {
  const audioPath = useCurrentEditingAudioPathValue()
  const audioDuration = useCurrentEditingAudioDurationValue()
  const viewportHeight = useWaveformViewportHeightValue()
  const totalHeight = useTotalHeightValue()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hoverLayerRef = useRef<HoverLayerRef>(null)

  // Measure the scroll container and keep viewport height / visible area in sync.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const sync = () => {
      const height = el.clientHeight
      const top = el.scrollTop
      setWaveformViewportHeight(height)
      setWaveformVisibleArea(top, top + height)
    }

    sync()

    const resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(el)

    el.addEventListener('scroll', sync, { passive: true })

    return () => {
      el.removeEventListener('scroll', sync)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (player.currentSource !== audioPath) {
      player.load(audioPath)
    }

    return () => {
      player.pause()
    }
  }, [audioPath])

  // Toggle playing by `Space`.
  useEffect(() => {
    const handleTogglePlay = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        player.togglePlay()
      }
    }

    document.addEventListener('keydown', handleTogglePlay)

    return () => document.removeEventListener('keydown', handleTogglePlay)
  }, [])

  // Handle external scroll commands (from VirtualMarks, FollowModeDispatcher, etc.)
  useEffect(() => {
    const sub = waveformScroll.subscribe(({ top, behavior }) => {
      scrollContainerRef.current?.scrollTo({
        top,
        behavior: behavior ?? 'smooth',
      })
    })

    return () => sub.unsubscribe()
  }, [])

  // Reset scrollTop when path changes
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }, [audioPath])

  // Single document-level pointer listener — feeds the shared `pointerMove`
  // stream that every consumer (`usePointerInRect`) subscribes to.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerMove.next({ x: e.clientX, y: e.clientY })
    }
    document.addEventListener('pointermove', onMove)
    return () => document.removeEventListener('pointermove', onMove)
  }, [])

  // Track hovered row by pointer Y across waveform / cards / gaps. Re-evaluates
  // on scroll too so the highlight updates when the content moves under a
  // stationary cursor.
  usePointerInRect({
    targetRef: scrollContainerRef,
    scrollRef: scrollContainerRef,
    onUpdate: ({ inside, y, rect }) => {
      if (!inside) {
        setHoveredRowIndex(-1)
        return
      }
      const el = scrollContainerRef.current
      if (!el) return
      const contentY = y - rect.top + el.scrollTop
      setHoveredRowIndex(findRowIndexByY(contentY))
    },
  })

  // Clear hover state on unmount.
  useEffect(() => () => setHoveredRowIndex(-1), [])

  const ready = viewportHeight > 0

  return (
    <>
      <div className="relative flex grow">
        <div
          ref={scrollContainerRef}
          className="scrollbar-none absolute inset-0 overflow-y-auto"
        >
          {ready && (
            <div
              className="relative isolate flex"
              style={{ height: totalHeight }}
            >
              <div className="border-border bg-secondary relative z-0 w-[350px] shrink-0 border-r">
                <WaveformCanvas
                  path={audioPath}
                  duration={audioDuration}
                  mergeChannels={false}
                  scrollContainerRef={scrollContainerRef}
                  hoverLayerRef={hoverLayerRef}
                  totalHeight={totalHeight}
                />
              </div>

              <MarksLayer />

              <div className="relative z-20 grow pl-5">
                <TimelineContent />
              </div>
            </div>
          )}
        </div>

        {ready && <PlaybackIndicator scrollContainerRef={scrollContainerRef} />}

        <FloatController />

        <HoverLayer ref={hoverLayerRef} />
      </div>

      {ready && (
        <FollowModeDispatcher scrollContainerRef={scrollContainerRef} />
      )}
    </>
  )
}
