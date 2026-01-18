import { RefObject, useEffect, useRef, useSyncExternalStore } from 'react'

interface WaveformScrollState {
  scrollTop: number
  viewportHeight: number
  totalHeight: number
}

interface UseWaveformScrollOptions {
  duration: number
  resolution: number
  marginBlock: number
}

export function useWaveformScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseWaveformScrollOptions,
): WaveformScrollState {
  const stateRef = useRef<WaveformScrollState>({
    scrollTop: 0,
    viewportHeight: 0,
    totalHeight: 0,
  })

  const subscribersRef = useRef(new Set<() => void>())

  const totalHeight =
    options.marginBlock * 2 +
    (options.duration * options.resolution) / window.devicePixelRatio

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      stateRef.current = {
        scrollTop: container.scrollTop,
        viewportHeight: container.clientHeight,
        totalHeight,
      }
      subscribersRef.current.forEach((cb) => cb())
    }

    update()

    const handleScroll = () => update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(container)

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [containerRef, totalHeight])

  return useSyncExternalStore(
    (cb) => {
      subscribersRef.current.add(cb)
      return () => subscribersRef.current.delete(cb)
    },
    () => stateRef.current,
  )
}
