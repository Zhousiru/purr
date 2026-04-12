import { useIsFollowModeValue } from '@/atoms/editor'
import { player } from '@/lib/player'
import { RefObject, useEffect, useRef } from 'react'
import { seekHeight } from '../waveform-canvas/utils'

type PlaybackIndicatorProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function PlaybackIndicator({
  scrollContainerRef,
}: PlaybackIndicatorProps) {
  const isFollowMode = useIsFollowModeValue()
  const indicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = indicatorRef.current
    const scrollEl = scrollContainerRef.current
    if (!el || !scrollEl) return

    if (isFollowMode) {
      // Static center
      el.style.top = '50%'
      el.style.display = ''
      return
    }

    // Non-follow mode
    const update = () => {
      const y = seekHeight(player.currentTime) - scrollEl.scrollTop
      if (y < 0 || y > scrollEl.clientHeight) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
        el.style.top = y + 'px'
      }
    }

    update()
    const unsubTime = player.subCurrentTime(update)
    scrollEl.addEventListener('scroll', update, { passive: true })

    return () => {
      unsubTime()
      scrollEl.removeEventListener('scroll', update)
    }
  }, [isFollowMode, scrollContainerRef])

  return (
    <div
      ref={indicatorRef}
      className="pointer-events-none absolute inset-x-0 z-30 border-t border-blue-500"
    />
  )
}
