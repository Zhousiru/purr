import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { determineCurrentTextIndex } from '@/components/layout/editor/follow-mode-dispatcher/utils'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { useEffect, useRef, useState } from 'react'

export function SubtitlePanel() {
  const task = useCurrentEditingTaskValue()
  const data = task.result?.data
  const [text, setText] = useState('')
  const prevIndexRef = useRef(-1)

  useEffect(() => {
    if (!data) return

    const unsub = player.subCurrentTime((time) => {
      const index = determineCurrentTextIndex(time)
      if (index === prevIndexRef.current) return
      prevIndexRef.current = index
      setText(index === -1 ? '' : data[index].text)
    })

    return () => unsub()
  }, [data])

  return (
    <div
      className={cn(
        'absolute inset-x-4 bottom-4 rounded-lg bg-neutral-700/75 px-4 py-3 text-center text-sm text-white shadow-lg transition-opacity',
        text ? 'opacity-100' : 'opacity-0',
      )}
    >
      {text || '\u00A0'}
    </div>
  )
}
