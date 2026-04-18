import {
  getEffectiveResolution,
  getIsFollowMode,
  getMarginBlock,
  getWaveformViewportHeight,
  getZoomLevel,
  setZoomLevel,
  ZOOM_LEVELS,
  ZoomLevel,
} from '@/atoms/editor'
import { player } from '@/lib/player'

export const seekHeightWithResolution = (time: number, resolution: number) =>
  getMarginBlock() + (time * resolution) / window.devicePixelRatio

export const seekTimeWithResolution = (height: number, resolution: number) =>
  ((height - getMarginBlock()) * window.devicePixelRatio) / resolution

export const seekHeight = (time: number) =>
  seekHeightWithResolution(time, getEffectiveResolution())

export const seekTime = (height: number) =>
  seekTimeWithResolution(height, getEffectiveResolution())

export const clientYToContentY = (clientY: number, scrollEl: HTMLElement) =>
  clientY - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop

/**
 * Ctrl+wheel zoom. Returns true when the event was handled, so callers can
 * fall through to default scroll behavior otherwise.
 */
export function handleZoomWheel(e: WheelEvent, scrollEl: HTMLElement): boolean {
  if (!e.ctrlKey) return false
  e.preventDefault()

  const currentZoom = getZoomLevel()
  const currentIndex = ZOOM_LEVELS.indexOf(currentZoom)

  const newIndex =
    e.deltaY > 0
      ? Math.max(0, currentIndex - 1)
      : Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1)
  const newZoom = ZOOM_LEVELS[newIndex] as ZoomLevel

  if (newZoom === currentZoom) return true

  if (getIsFollowMode()) {
    setZoomLevel(newZoom)
    requestAnimationFrame(() => {
      const centerHeight = seekHeightWithResolution(
        player.currentTime,
        getEffectiveResolution(),
      )
      scrollEl.scrollTop = centerHeight - getWaveformViewportHeight() / 2
    })
  } else {
    const mouseY = e.clientY - scrollEl.getBoundingClientRect().top
    const scrollTop = scrollEl.scrollTop
    const oldResolution = getEffectiveResolution()
    const mouseTime = seekTimeWithResolution(scrollTop + mouseY, oldResolution)

    setZoomLevel(newZoom)

    requestAnimationFrame(() => {
      const newResolution = getEffectiveResolution()
      const newMouseHeight = seekHeightWithResolution(mouseTime, newResolution)
      scrollEl.scrollTop = newMouseHeight - mouseY
    })
  }

  return true
}
