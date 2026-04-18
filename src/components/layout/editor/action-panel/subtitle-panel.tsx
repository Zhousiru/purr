import { getDataMap } from '@/atoms/editor'
import { determineCurrentTextId } from '@/components/layout/editor/follow-mode-dispatcher/utils'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { useEffect, useRef, useState } from 'react'

export function SubtitlePanel() {
  const [text, setText] = useState('')
  const prevIdRef = useRef<string | null>(null)

  useEffect(() => {
    return player.subCurrentTime((time) => {
      const id = determineCurrentTextId(time)
      if (id === prevIdRef.current) return
      prevIdRef.current = id
      setText(id ? (getDataMap().get(id)?.text ?? '') : '')
    })
  }, [])

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
