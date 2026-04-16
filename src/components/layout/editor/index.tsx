import {
  findRowIdByY,
  setHoveredRowId,
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
import { Group, Panel, Separator } from 'react-resizable-panels'
import { ActionPanel } from './action-panel'
import { BoundaryHandles } from './boundary-handles'
import { FollowModeDispatcher } from './follow-mode-dispatcher'
import { MarksLayer } from './marks-layer'
import { PlaybackIndicator } from './playback-indicator'
import { TimelineContent } from './timeline-content'
import { HoverLayer, HoverLayerRef } from './waveform-canvas/HoverLayer'

export function Editor() {
  const sourcePath = useCurrentEditingAudioPathValue()
  const sourceDuration = useCurrentEditingAudioDurationValue()
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
    if (player.currentSource !== sourcePath) {
      void player.load(sourcePath).catch(() => {})
    }

    return () => {
      player.pause()
    }
  }, [sourcePath])

  // Toggle playing by `Space`.
  useEffect(() => {
    const handleTogglePlay = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        void player.togglePlay().catch(() => {})
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
  }, [sourcePath])

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
        setHoveredRowId(null)
        return
      }
      const el = scrollContainerRef.current
      if (!el) return
      const contentY = y - rect.top + el.scrollTop
      setHoveredRowId(findRowIdByY(contentY))
    },
  })

  // Clear hover state on unmount.
  useEffect(() => () => setHoveredRowId(null), [])

  const ready = viewportHeight > 0

  return (
    <>
      <Group orientation="horizontal" id="editor-outer" className="grow">
        <Panel id="action" defaultSize="350px" minSize="280px" maxSize="500px">
          <ActionPanel />
        </Panel>

        <Separator className="border-border hover:border-accent active:border-accent w-0 border-r transition-colors outline-none" />

        <Panel id="editor" className="relative">
          <div
            ref={scrollContainerRef}
            className="scrollbar-none absolute inset-0 overflow-y-auto"
          >
            {ready && (
              <div className="relative" style={{ height: totalHeight }}>
                <Group
                  orientation="horizontal"
                  id="editor-inner"
                  className="h-full"
                >
                  <Panel
                    id="waveform"
                    defaultSize="350px"
                    minSize="200px"
                    maxSize="600px"
                    className="bg-secondary scrollbar-none relative z-0"
                  >
                    <WaveformCanvas
                      path={sourcePath}
                      duration={sourceDuration}
                      mergeChannels={false}
                      scrollContainerRef={scrollContainerRef}
                      hoverLayerRef={hoverLayerRef}
                      totalHeight={totalHeight}
                    />
                  </Panel>

                  <Separator className="border-border hover:border-accent active:border-accent w-0 border-r transition-colors outline-none" />

                  <Panel
                    id="text"
                    className="scrollbar-none relative z-20 pl-5"
                  >
                    <TimelineContent />
                  </Panel>
                </Group>

                <MarksLayer />
                <BoundaryHandles scrollContainerRef={scrollContainerRef} />
              </div>
            )}
          </div>

          {ready && (
            <PlaybackIndicator scrollContainerRef={scrollContainerRef} />
          )}

          <HoverLayer ref={hoverLayerRef} />
        </Panel>
      </Group>

      {ready && (
        <FollowModeDispatcher scrollContainerRef={scrollContainerRef} />
      )}
    </>
  )
}
