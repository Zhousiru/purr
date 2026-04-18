import { RefObject, useEffect, useState } from 'react'

export type ScrollSpySection = {
  id: string
  ref: RefObject<HTMLElement | null>
}

type UseScrollSpyArgs = {
  sections: ScrollSpySection[]
  rootRef: RefObject<HTMLElement | null>
  rootMargin?: string
  threshold?: number | number[]
}

export function useScrollSpy({
  sections,
  rootRef,
  rootMargin = '0px',
  threshold = 0,
}: UseScrollSpyArgs): Set<string> {
  const [visible, setVisible] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const elementToId = new Map<Element, string>()
    for (const section of sections) {
      const el = section.ref.current
      if (el) elementToId.set(el, section.id)
    }
    if (elementToId.size === 0) return

    const intersecting = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = elementToId.get(entry.target)
          if (!id) continue
          if (entry.isIntersecting) intersecting.add(id)
          else intersecting.delete(id)
        }
        setVisible(new Set(intersecting))
      },
      { root, rootMargin, threshold },
    )

    for (const el of elementToId.keys()) observer.observe(el)

    return () => observer.disconnect()
  }, [sections, rootRef, rootMargin, threshold])

  return visible
}
