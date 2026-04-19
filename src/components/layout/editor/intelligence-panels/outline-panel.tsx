import {
  useCurrentEditingTaskAtomValue,
  useCurrentEditingTaskValue,
} from '@/atoms/editor'
import {
  useOutlinePanelOpen,
  useOutlinePanelPosition,
} from '@/atoms/intelligence-panels'
import { FloatingPanel } from '@/components/ui/floating-panel'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import {
  isOutlineRunning,
  startOutline,
  stopOutline,
} from '@/lib/intelligence/runner'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { OutlineItem, TranscribeTask } from '@/types/tasks'
import {
  IconAlertTriangle,
  IconPlayerStop,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

function findActiveIndex(items: OutlineItem[], time: number): number {
  if (items.length === 0) return -1
  let lo = 0
  let hi = items.length - 1
  let best = -1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (items[mid].timestamp <= time) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

export function OutlinePanel() {
  const [open, setOpen] = useOutlinePanelOpen()
  const [position, setPosition] = useOutlinePanelPosition()
  const taskAtom = useCurrentEditingTaskAtomValue()
  const task = useCurrentEditingTaskValue()

  if (!open || !taskAtom) return null

  return (
    <FloatingPanel
      open={open}
      onClose={() => setOpen(false)}
      title="AI Outline"
      position={position}
      onPositionChange={setPosition}
      width={360}
      height={500}
      headerActions={<OutlineHeaderActions task={task} taskAtom={taskAtom} />}
    >
      <OutlineBody task={task} taskAtom={taskAtom} />
    </FloatingPanel>
  )
}

function OutlineHeaderActions({
  task,
  taskAtom,
}: {
  task: TranscribeTask
  taskAtom: TaskAtom<TranscribeTask>
}) {
  const running = task.outline?.status === 'processing' || isOutlineRunning(task.id)
  const done = task.outline?.status === 'done'

  if (running) {
    return (
      <button
        type="button"
        onClick={() => stopOutline(task.id)}
        className="text-foreground/50 hover:text-foreground flex h-6 w-6 items-center justify-center rounded hover:bg-black/5"
        aria-label="Stop"
        title="Stop"
      >
        <IconPlayerStop size={14} />
      </button>
    )
  }

  if (done) {
    return (
      <button
        type="button"
        onClick={() => startOutline(taskAtom)}
        className="text-foreground/50 hover:text-foreground flex h-6 w-6 items-center justify-center rounded hover:bg-black/5"
        aria-label="Regenerate"
        title="Regenerate"
      >
        <IconRefresh size={14} />
      </button>
    )
  }

  return null
}

function OutlineBody({
  task,
  taskAtom,
}: {
  task: TranscribeTask
  taskAtom: TaskAtom<TranscribeTask>
}) {
  const outline = task.outline

  if (!outline || (outline.status === 'error' && !outline.items?.length)) {
    return (
      <EmptyOrError
        status={outline?.status}
        error={outline?.error}
        onGenerate={() => startOutline(taskAtom)}
      />
    )
  }

  if (outline.status === 'processing' && !outline.items?.length) {
    return <LoadingState label="Extracting outline…" />
  }

  const items = outline.items ?? []
  if (items.length === 0) {
    return (
      <EmptyOrError
        status={outline.status}
        error={outline.error}
        onGenerate={() => startOutline(taskAtom)}
      />
    )
  }

  return <OutlineList items={items} />
}

function OutlineList({ items }: { items: OutlineItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const prevIndexRef = useRef<number>(-1)

  useEffect(() => {
    prevIndexRef.current = -1
    return player.subCurrentTime((time) => {
      const idx = findActiveIndex(items, time)
      if (idx !== prevIndexRef.current) {
        prevIndexRef.current = idx
        setActiveIndex(idx)
      }
    })
  }, [items])

  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current) return
    const el = scrollRef.current.querySelector<HTMLElement>(
      `[data-outline-idx="${activeIndex}"]`,
    )
    if (!el) return
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-1">
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          data-outline-idx={i}
          onClick={() => player.seek(item.timestamp)}
          className={cn(
            'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
            'hover:bg-black/5',
            i === activeIndex && 'bg-blue-500/10',
          )}
          style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
        >
          <span
            className={cn(
              'mt-0.5 shrink-0 rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] leading-none',
              i === activeIndex &&
                'bg-blue-500 text-white',
            )}
          >
            {formatSec(item.timestamp, false)}
          </span>
          <span
            className={cn(
              'grow leading-tight',
              item.level === 1 && 'font-semibold',
              item.level === 3 && 'text-foreground/70',
            )}
          >
            {item.title}
          </span>
        </button>
      ))}
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-xs">
      <IconSparkles size={18} className="animate-pulse text-blue-500" />
      <div className="text-foreground/60">{label}</div>
    </div>
  )
}

function EmptyOrError({
  status,
  error,
  onGenerate,
}: {
  status?: 'processing' | 'done' | 'error'
  error?: string
  onGenerate: () => void
}) {
  const isError = status === 'error'
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-xs">
      {isError ? (
        <>
          <IconAlertTriangle size={20} className="text-amber-500" />
          <div className="text-foreground/80">
            Couldn't generate outline.
            {error && (
              <div className="text-foreground/50 mt-1 text-[11px]">{error}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <IconSparkles size={20} className="text-blue-500" />
          <div className="text-foreground/70 max-w-[220px]">
            Extract a structured outline from the transcript so you can
            navigate between topics.
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
          >
            <IconSparkles size={14} />
            Generate outline
          </button>
        </>
      )}
    </div>
  )
}
