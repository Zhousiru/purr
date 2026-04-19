import {
  useCurrentEditingTaskAtomValue,
  useCurrentEditingTaskValue,
} from '@/atoms/editor'
import {
  useSummaryPanelOpen,
  useSummaryPanelPosition,
} from '@/atoms/intelligence-panels'
import { FloatingPanel } from '@/components/ui/floating-panel'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import {
  isSummaryRunning,
  startSummary,
  stopSummary,
} from '@/lib/intelligence/runner'
import { TranscribeTask } from '@/types/tasks'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconPlayerStop,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export function SummaryPanel() {
  const [open, setOpen] = useSummaryPanelOpen()
  const [position, setPosition] = useSummaryPanelPosition()
  const taskAtom = useCurrentEditingTaskAtomValue()
  const task = useCurrentEditingTaskValue()

  if (!open || !taskAtom) return null

  return (
    <FloatingPanel
      open={open}
      onClose={() => setOpen(false)}
      title="Summary"
      position={position}
      onPositionChange={setPosition}
      width={420}
      height={500}
      headerActions={<SummaryHeaderActions task={task} taskAtom={taskAtom} />}
    >
      <SummaryBody task={task} taskAtom={taskAtom} />
    </FloatingPanel>
  )
}

function SummaryHeaderActions({
  task,
  taskAtom,
}: {
  task: TranscribeTask
  taskAtom: TaskAtom<TranscribeTask>
}) {
  const running = task.summary?.status === 'processing' || isSummaryRunning(task.id)
  const done = task.summary?.status === 'done'
  const content = task.summary?.content ?? ''

  if (running) {
    return (
      <button
        type="button"
        onClick={() => stopSummary(task.id)}
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
      <>
        <CopyButton text={content} />
        <button
          type="button"
          onClick={() => startSummary(taskAtom)}
          className="text-foreground/50 hover:text-foreground flex h-6 w-6 items-center justify-center rounded hover:bg-black/5"
          aria-label="Regenerate"
          title="Regenerate"
        >
          <IconRefresh size={14} />
        </button>
      </>
    )
  }

  return null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await writeText(text)
          setCopied(true)
        } catch (err) {
          console.error('[summary] copy failed', err)
        }
      }}
      className="text-foreground/50 hover:text-foreground flex h-6 w-6 items-center justify-center rounded hover:bg-black/5"
      aria-label="Copy"
      title={copied ? 'Copied' : 'Copy'}
    >
      {copied ? (
        <IconCheck size={14} className="text-green-500" />
      ) : (
        <IconCopy size={14} />
      )}
    </button>
  )
}

function SummaryBody({
  task,
  taskAtom,
}: {
  task: TranscribeTask
  taskAtom: TaskAtom<TranscribeTask>
}) {
  const summary = task.summary

  if (!summary) {
    return (
      <EmptyOrError
        status={undefined}
        error={undefined}
        onGenerate={() => startSummary(taskAtom)}
      />
    )
  }

  if (summary.status === 'error' && !summary.content) {
    return (
      <EmptyOrError
        status="error"
        error={summary.error}
        onGenerate={() => startSummary(taskAtom)}
      />
    )
  }

  const content = summary.content ?? ''
  if (summary.status === 'processing' && !content) {
    return <LoadingState label="Summarizing transcript…" />
  }

  if (!content) {
    return (
      <EmptyOrError
        status={summary.status}
        error={summary.error}
        onGenerate={() => startSummary(taskAtom)}
      />
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {content}
        {summary.status === 'processing' && (
          <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-blue-500 align-middle" />
        )}
      </div>
      {summary.status === 'error' && (
        <div className="text-foreground/50 mt-3 flex items-center gap-1.5 text-[11px]">
          <IconAlertTriangle size={12} className="text-amber-500" />
          {summary.error ?? 'Generation failed'}
        </div>
      )}
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
            Couldn't generate summary.
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
          <div className="text-foreground/70 max-w-[260px]">
            Generate a concise summary of what the transcript is about.
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
          >
            <IconSparkles size={14} />
            Generate summary
          </button>
        </>
      )}
    </div>
  )
}
