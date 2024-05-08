import {
  getWaveformViewportHeight,
  getWaveformVisibleArea,
  useIsFollowModeValue,
} from '@/atoms/editor'
import { followModeWaveformReserve } from '@/constants/editor'
import { player } from '@/lib/player'
import { textFocus, waveformScroll } from '@/subjects/editor'
import { useEffect } from 'react'
import { seekHeight } from '../waveform-canvas/utils'
import { determineCurrentTextIndex } from './utils'

export function FollowModeDispatcher() {
  const isFollowMode = useIsFollowModeValue()

  useEffect(() => {
    if (!isFollowMode) return

    // Save `waveformLastScrollTop` to avoid delayed updates caused by scroll animation.
    let waveformLastScrollTop: number | null = null
    let textLastFocusIndex: number | null = null

    const unsub = player.subCurrentTime((time) => {
      // Dispatch waveform scrolling.
      const waveformVisibleArea = getWaveformVisibleArea()
      const waveformHeight = getWaveformViewportHeight()

      const indicatorTop = seekHeight(time)

      if (waveformLastScrollTop === null) {
        const areaStart = waveformVisibleArea.startY + followModeWaveformReserve
        const areaEnd = waveformVisibleArea.endY - followModeWaveformReserve
        if (indicatorTop < areaStart || indicatorTop > areaEnd) {
          const top = indicatorTop - followModeWaveformReserve
          waveformScroll.next({
            top,
          })
          waveformLastScrollTop = top
        }
      } else {
        const areaStart = waveformLastScrollTop + followModeWaveformReserve
        const areaEnd =
          waveformLastScrollTop + waveformHeight - followModeWaveformReserve

        if (indicatorTop < areaStart || indicatorTop > areaEnd) {
          const top = indicatorTop - followModeWaveformReserve
          waveformScroll.next({
            top,
          })
          waveformLastScrollTop = top
        }
      }

      // Dispatch `TimelineContent` focus.
      const textFocusIndex = determineCurrentTextIndex(time)
      if (textFocusIndex !== textLastFocusIndex) {
        textFocus.next({ index: textFocusIndex })
        textLastFocusIndex = textFocusIndex
      }
    })

    return () => {
      unsub()
      textFocus.next({ index: -1 })
    }
  }, [isFollowMode])

  return null
}
