import {
  getWaveformViewportHeight,
  setHighlightedRowIds,
  useIsFollowModeValue,
} from '@/atoms/editor'
import { player } from '@/lib/player'
import { userScrub } from '@/subjects/editor'
import { RefObject, useEffect } from 'react'
import { seekHeight, seekTime } from '../waveform-canvas/utils'
import { determineCurrentTextId } from './utils'

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
    let textLastFocusId: string | null = null
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

    const unsubTime = player.subCurrentTime((time) => {
      const id = determineCurrentTextId(time)
      if (id !== textLastFocusId) {
        setHighlightedRowIds(id ? [id] : [])
        textLastFocusId = id
      }

      if (inUserMode()) return

      const target = seekHeight(time) - getWaveformViewportHeight() / 2
      expectedScrollTop = target
      scrollEl.scrollTop = target
    })

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      addSource('wheel')
      bumpWheelIdle()
    }

    const onScroll = () => {
      const current = scrollEl.scrollTop
      if (current === expectedScrollTop) return
      if (!inUserMode()) return
      expectedScrollTop = current
      seekToCenter(current)
      if (sources.has('wheel')) bumpWheelIdle()
    }

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
      setHighlightedRowIds([])
    }
  }, [isFollowMode, scrollContainerRef])

  return null
}
