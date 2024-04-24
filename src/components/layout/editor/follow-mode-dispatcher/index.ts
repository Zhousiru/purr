import {
  getWaveformViewportHeight,
  getWaveformVisibleArea,
  useIsFollowModeValue,
} from '@/atoms/editor'
import { followModeWaveformReserve } from '@/constants/editor'
import { player } from '@/lib/player'
import { waveformScroll } from '@/subjects/editor'
import { useEffect } from 'react'
import { seekHeight } from '../waveform-canvas/utils'

export function FollowModeDispatcher() {
  const isFollowMode = useIsFollowModeValue()

  useEffect(() => {
    if (!isFollowMode) return

    // Save `lastScrollTop` to avoid delayed updates caused by scroll animation.
    let lastScrollTop: number | null = null

    const unsub = player.subCurrentTime((time) => {
      const waveformVisibleArea = getWaveformVisibleArea()
      const waveformHeight = getWaveformViewportHeight()

      const indicatorTop = seekHeight(time)

      if (lastScrollTop === null) {
        const areaStart = waveformVisibleArea.startY + followModeWaveformReserve
        const areaEnd = waveformVisibleArea.endY - followModeWaveformReserve
        if (indicatorTop < areaStart || indicatorTop > areaEnd) {
          const top = indicatorTop - followModeWaveformReserve
          waveformScroll.next({
            top,
          })
          lastScrollTop = top
        }
      } else {
        const areaStart = lastScrollTop + followModeWaveformReserve
        const areaEnd =
          lastScrollTop + waveformHeight - followModeWaveformReserve

        if (indicatorTop < areaStart || indicatorTop > areaEnd) {
          const top = indicatorTop - followModeWaveformReserve
          waveformScroll.next({
            top,
          })
          lastScrollTop = top
        }
      }
    })

    return () => unsub()
  }, [isFollowMode])

  return null
}
