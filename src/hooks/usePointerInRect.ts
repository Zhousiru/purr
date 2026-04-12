import { getPointerPosition, pointerMove } from '@/subjects/editor'
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'

type PointerInRectResult = {
  inside: boolean
  x: number
  y: number
  rect: DOMRect
}

type UsePointerInRectArgs = {
  targetRef: RefObject<HTMLElement | null>
  scrollRef?: RefObject<HTMLElement | null>
  onUpdate: (result: PointerInRectResult) => void
}

// Subscribes to the shared pointer stream and re-evaluates a rect hit-test
// whenever the pointer moves or (optionally) the given element scrolls.
export function usePointerInRect({
  targetRef,
  scrollRef,
  onUpdate,
}: UsePointerInRectArgs) {
  const onUpdateRef = useRef(onUpdate)
  useLayoutEffect(() => {
    onUpdateRef.current = onUpdate
  })

  useEffect(() => {
    const evaluate = () => {
      const target = targetRef.current
      if (!target) return
      const rect = target.getBoundingClientRect()
      const { x, y } = getPointerPosition()
      const inside =
        x >= rect.left &&
        x < rect.right &&
        y >= rect.top &&
        y < rect.bottom
      onUpdateRef.current({ inside, x, y, rect })
    }

    const sub = pointerMove.subscribe(evaluate)
    const scrollEl = scrollRef?.current
    scrollEl?.addEventListener('scroll', evaluate, { passive: true })

    return () => {
      sub.unsubscribe()
      scrollEl?.removeEventListener('scroll', evaluate)
    }
  }, [targetRef, scrollRef])
}
