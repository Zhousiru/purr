import {
  getDataMap,
  useCurrentEditingTaskValue,
} from '@/atoms/editor'
import { translateTaskListAtom } from '@/atoms/tasks'
import { useViewState } from '@/atoms/viewed-variations'
import { determineCurrentTextId } from '@/components/layout/editor/follow-mode-dispatcher/utils'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { player } from '@/lib/player'
import { store } from '@/lib/store'
import { cn } from '@/lib/utils/cn'
import { TranslateTask, Translation } from '@/types/tasks'
import { useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export function SubtitlePanel() {
  const parent = useCurrentEditingTaskValue()
  const viewState = useViewState(parent.id)
  const translateAtoms = useAtomValue(translateTaskListAtom)

  const flaggedId = viewState?.flagged ?? parent.id
  const flaggedTranslateAtom =
    flaggedId === parent.id
      ? null
      : (translateAtoms.find((a) => store.get(a).id === flaggedId) ?? null)

  if (flaggedTranslateAtom) {
    return <TranslatedSubtitleContent atom={flaggedTranslateAtom} />
  }
  return <OriginalSubtitleContent />
}

function SubtitleBubble({ text }: { text: string }) {
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

function OriginalSubtitleContent() {
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

  return <SubtitleBubble text={text} />
}

function TranslatedSubtitleContent({
  atom,
}: {
  atom: TaskAtom<TranslateTask>
}) {
  const task = useAtomValue(atom)
  const [text, setText] = useState('')
  const prevKeyRef = useRef<string>('')

  useEffect(() => {
    // Reset on task change so the new translation set is queried.
    prevKeyRef.current = ''

    return player.subCurrentTime((time) => {
      const id = determineCurrentTextId(time)
      const key = `${task.id}:${id ?? ''}`
      if (key === prevKeyRef.current) return
      prevKeyRef.current = key

      if (!id) {
        setText('')
        return
      }
      const item = task.result?.data.find((d) => d.id === id) as
        | Translation
        | undefined
      setText(item?.translated ?? '')
    })
  }, [task])

  return <SubtitleBubble text={text} />
}
