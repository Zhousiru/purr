import {
  getWaveformViewportHeight,
  setActiveRowIndex,
  useIsFollowModeValue,
} from '@/atoms/editor'
import { player } from '@/lib/player'
import { userScrub } from '@/subjects/editor'
import { RefObject, useEffect } from 'react'
import { seekHeight, seekTime } from '../waveform-canvas/utils'
import { determineCurrentTextIndex } from './utils'

const WHEEL_IDLE_MS = 100

type FollowModeDispatcherProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function FollowModeDispatcher({
  scrollContainerRef,
}: FollowModeDispatcherProps) {
  const isFollowMode = useIsFollowModeValue()

  useEffect(() => {
    if (!isFollowMode) return
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return

    const sources = new Set<'drag' | 'wheel'>()
    let expectedScrollTop = scrollEl.scrollTop
    let textLastFocusIndex: number | null = null
    let resumeOnRelease = false
    let wheelIdleTimer: ReturnType<typeof setTimeout> | null = null

    const inUserMode = () => sources.size > 0

    const addSource = (s: 'drag' | 'wheel') => {
      const wasEmpty = sources.size === 0
      sources.add(s)
      if (wasEmpty) {
        resumeOnRelease = player.isPlaying
        if (resumeOnRelease) player.pause()
      }
    }

    const removeSource = (s: 'drag' | 'wheel') => {
      if (!sources.delete(s)) return
      if (sources.size === 0 && resumeOnRelease) {
        resumeOnRelease = false
        void player.play().catch(() => {})
      }
    }

    const bumpWheelIdle = () => {
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer)
      wheelIdleTimer = setTimeout(() => {
        wheelIdleTimer = null
        removeSource('wheel')
      }, WHEEL_IDLE_MS)
    }

    const seekToCenter = (scrollTop: number) => {
      const newTime = seekTime(scrollTop + getWaveformViewportHeight() / 2)
      player.seek(Math.max(0, newTime))
    }

    // Player → scroll. Suspended while user is scrubbing so we don't fight
    // native scroll animations.
    const unsubTime = player.subCurrentTime((time) => {
      const index = determineCurrentTextIndex(time)
      if (index !== textLastFocusIndex) {
        setActiveRowIndex(index)
        textLastFocusIndex = index
      }

      if (inUserMode()) return

      const target = seekHeight(time) - getWaveformViewportHeight() / 2
      expectedScrollTop = target
      scrollEl.scrollTop = target
    })

    // Wheel (incl. trackpad) is the explicit entry signal for wheel scrubbing.
    // Each tick extends the idle timer; momentum-driven scroll events also
    // extend it so inertia stays in user mode until it fully settles.
    // Ctrl+wheel is a zoom gesture handled by the waveform canvas, not a scrub.
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      addSource('wheel')
      bumpWheelIdle()
    }

    // Scroll: while in user mode, seek the player to match the current center.
    // While in player mode, this either matches `expectedScrollTop` (our own
    // write, skip) or is some other source we can't classify — ignore.
    const onScroll = () => {
      const current = scrollEl.scrollTop
      if (current === expectedScrollTop) return
      if (!inUserMode()) return
      expectedScrollTop = current
      seekToCenter(current)
      if (sources.has('wheel')) bumpWheelIdle()
    }

    // Drag emits explicit start / end from the waveform pointer handler.
    const scrubSub = userScrub.subscribe((phase) => {
      if (phase === 'start') addSource('drag')
      else removeSource('drag')
    })

    scrollEl.addEventListener('wheel', onWheel, { passive: true })
    scrollEl.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      unsubTime()
      scrubSub.unsubscribe()
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer)
      scrollEl.removeEventListener('wheel', onWheel)
      scrollEl.removeEventListener('scroll', onScroll)
      setActiveRowIndex(-1)
    }
  }, [isFollowMode, scrollContainerRef])

  return null
}
