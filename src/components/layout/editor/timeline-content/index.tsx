import {
  getCardPositions,
  getHoveredRowId,
  getWaveformViewportHeight,
  setHighlightedRowIds,
  useCurrentEditingTask,
  useCurrentEditingTaskAtomValue,
  useDataMapValue,
  useDragInvalidIdValue,
  useHighlightedRowIdsValue,
  useHoveredRowIdValue,
  useIsFollowModeValue,
  useVisibleCardPositionsValue,
} from '@/atoms/editor'
import { getIsAnyModalOpen } from '@/atoms/modal-open'
import { translateTaskListAtom } from '@/atoms/tasks'
import { useViewState } from '@/atoms/viewed-variations'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { cn } from '@/lib/utils/cn'
import { isTypingInInput } from '@/lib/utils/focus'
import { waveformScroll } from '@/subjects/editor'
import { TranscribeTask, TranslateTask, Translation } from '@/types/tasks'
import { IconLoader2 } from '@tabler/icons-react'
import { produce } from 'immer'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import { TextCard } from './TextCard'

type TextFieldProps = {
  compact: boolean
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

function TextField({ compact, value, onChange, readOnly }: TextFieldProps) {
  const base =
    'border-transparent w-full bg-transparent outline-none border-b focus:border-accent'
  if (compact) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
        autoComplete="off"
        readOnly={readOnly}
      />
    )
  }
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(base, 'scrollbar-none field-sizing-content resize-none')}
      autoComplete="off"
      readOnly={readOnly}
    />
  )
}

function FieldSpinner() {
  return (
    <div className="text-foreground/40 flex items-center gap-1.5 text-xs">
      <IconLoader2 size={12} className="animate-spin" />
      <span>Translating…</span>
    </div>
  )
}

type ViewedSource =
  | { kind: 'transcribe'; atom: TaskAtom<TranscribeTask> }
  | { kind: 'translate'; atom: TaskAtom<TranslateTask> }

function TranscribeVariationField({
  atom,
  cardId,
  compact,
}: {
  atom: TaskAtom<TranscribeTask>
  cardId: string
  compact: boolean
}) {
  const [task, setTask] = useAtom(atom)
  const item = task.result?.data.find((d) => d.id === cardId)
  if (!item) return null

  return (
    <TextField
      compact={compact}
      value={item.text}
      onChange={(v) =>
        setTask((prev) =>
          produce(prev, (draft) => {
            const it = draft.result?.data.find((d) => d.id === cardId)
            if (it) it.text = v
          }),
        )
      }
    />
  )
}

function TranslateVariationField({
  atom,
  cardId,
  compact,
}: {
  atom: TaskAtom<TranslateTask>
  cardId: string
  compact: boolean
}) {
  const [task, setTask] = useAtom(atom)
  const item = task.result?.data.find((d) => d.id === cardId)

  if (!item) {
    const wip = task.status === 'processing' || task.status === 'queued'
    if (wip) return <FieldSpinner />
    return <TextField compact={compact} value="" onChange={() => {}} readOnly />
  }

  return (
    <TextField
      compact={compact}
      value={(item as Translation).translated}
      onChange={(v) =>
        setTask((prev) =>
          produce(prev, (draft) => {
            const it = draft.result?.data.find((d) => d.id === cardId) as
              | Translation
              | undefined
            if (it) it.translated = v
          }),
        )
      }
    />
  )
}

export function TimelineContent() {
  const parentAtom = useCurrentEditingTaskAtomValue()!
  const [task, setTask] = useCurrentEditingTask()

  const result = task.result
  if (!result) {
    throw new Error('Task does not have result yet.')
  }

  const isFollowMode = useIsFollowModeValue()

  const visibleCards = useVisibleCardPositionsValue()
  const dataMap = useDataMapValue()
  const highlighted = useHighlightedRowIdsValue()
  const hoveredId = useHoveredRowIdValue()
  const dragInvalidId = useDragInvalidIdValue()

  const viewState = useViewState(task.id)
  const translateAtoms = useAtomValue(translateTaskListAtom)

  // Resolve viewed task ids → source atoms (parent transcribe or a translate atom).
  const viewedSources = useMemo<ViewedSource[]>(() => {
    if (!viewState) return [{ kind: 'transcribe', atom: parentAtom }]
    return viewState.viewed
      .map<ViewedSource | null>((id) => {
        if (id === task.id) return { kind: 'transcribe', atom: parentAtom }
        const a = translateAtoms.find((ta) => store.get(ta).id === id)
        return a ? { kind: 'translate', atom: a } : null
      })
      .filter((x): x is ViewedSource => x !== null)
  }, [viewState, task.id, parentAtom, translateAtoms])

  const flaggedSource = useMemo<ViewedSource | undefined>(() => {
    if (!viewState) return viewedSources[0]
    return (
      viewedSources.find((s) => {
        const id =
          s.kind === 'transcribe'
            ? store.get(s.atom).id
            : store.get(s.atom).id
        return id === viewState.flagged
      }) ?? viewedSources[0]
    )
  }, [viewedSources, viewState])

  // Handle accessible keyboard event.
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (getIsAnyModalOpen()) return
        const focused = document.activeElement
        if (!containerRef.current!.contains(focused)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        if (focused instanceof HTMLElement && !isFollowMode) {
          focused.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isFollowMode])

  // Active text card.
  function handleCardFocus(id: string) {
    if (isFollowMode) return

    setHighlightedRowIds([id])
    const card = getCardPositions().find((c) => c.id === id)
    if (card) {
      const centerY = card.top + card.height / 2
      const top = centerY - getWaveformViewportHeight() / 2
      waveformScroll.next({ top, behavior: 'smooth' })
    }
  }
  function handleCardBlur() {
    if (isFollowMode) return

    setHighlightedRowIds([])
  }

  // Delete hovered row on `X` when no input is focused. Deletes from the
  // parent transcribe; translate-task entries for that id become orphan
  // rows that no longer render (cards derive from the parent).
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'x') return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (getIsAnyModalOpen()) return
      if (isTypingInInput()) return

      const id = getHoveredRowId()
      if (!id) return

      e.preventDefault()
      setTask((prev) =>
        produce(prev, (draft) => {
          if (!draft.result) return
          draft.result.data = draft.result.data.filter((d) => d.id !== id)
        }),
      )
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  }, [setTask])

  const hasEmphasis = highlighted.length > 0 || hoveredId !== null

  return (
    <div className="absolute inset-0" ref={containerRef}>
      {visibleCards.map((card) => {
        const d = dataMap.get(card.id)
        if (!d) return null
        const isEmphasized =
          highlighted.includes(card.id) || hoveredId === card.id
        const compact = card.height < 60

        const sources = compact
          ? flaggedSource
            ? [flaggedSource]
            : []
          : viewedSources

        return (
          <TextCard
            key={card.id}
            start={d.start}
            end={d.end}
            compact={compact}
            hovered={hoveredId === card.id}
            className={cn(
              'absolute inset-x-4',
              card.id === dragInvalidId
                ? 'opacity-25'
                : hasEmphasis && !isEmphasized && 'opacity-50',
            )}
            style={{
              top: card.top,
              height: card.height,
            }}
            onFocus={() => handleCardFocus(card.id)}
            onBlur={() => handleCardBlur()}
          >
            {sources.map((s, i) =>
              s.kind === 'transcribe' ? (
                <TranscribeVariationField
                  key={`t-${i}`}
                  atom={s.atom}
                  cardId={card.id}
                  compact={compact}
                />
              ) : (
                <TranslateVariationField
                  key={`l-${i}`}
                  atom={s.atom}
                  cardId={card.id}
                  compact={compact}
                />
              ),
            )}
          </TextCard>
        )
      })}
    </div>
  )
}
