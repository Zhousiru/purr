import { llmProviderConfigAtom } from '@/atoms/llm-provider'
import { transcribeTaskListAtom } from '@/atoms/tasks'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import {
  OutlineState,
  SummaryState,
  TranscribeTask,
} from '@/types/tasks'
import { generateOutline } from './outline'
import { generateSummary } from './summary'

const outlineRuns = new Map<string, AbortController>()
const summaryRuns = new Map<string, AbortController>()

const SUMMARY_FLUSH_MS = 250

function modelTag(): string {
  const cfg = store.get(llmProviderConfigAtom)
  return `${cfg.provider}:${cfg.modelId}`
}

function errorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'Aborted'
  if (err instanceof Error) return err.message
  return String(err)
}

function updateOutline(
  taskAtom: TaskAtom<TranscribeTask>,
  patch: Partial<OutlineState> | ((prev: OutlineState | undefined) => OutlineState),
): void {
  store.set(taskAtom, (prev) => {
    const next =
      typeof patch === 'function'
        ? patch(prev.outline)
        : { ...(prev.outline ?? { status: 'processing' as const }), ...patch }
    return { ...prev, outline: next }
  })
}

function updateSummary(
  taskAtom: TaskAtom<TranscribeTask>,
  patch: Partial<SummaryState> | ((prev: SummaryState | undefined) => SummaryState),
): void {
  store.set(taskAtom, (prev) => {
    const next =
      typeof patch === 'function'
        ? patch(prev.summary)
        : { ...(prev.summary ?? { status: 'processing' as const }), ...patch }
    return { ...prev, summary: next }
  })
}

export function isOutlineRunning(taskId: string): boolean {
  return outlineRuns.has(taskId)
}

export function isSummaryRunning(taskId: string): boolean {
  return summaryRuns.has(taskId)
}

export function startOutline(taskAtom: TaskAtom<TranscribeTask>): void {
  const task = store.get(taskAtom)
  if (outlineRuns.has(task.id)) return

  const controller = new AbortController()
  outlineRuns.set(task.id, controller)

  const model = modelTag()
  updateOutline(taskAtom, () => ({
    status: 'processing',
    model,
  }))

  ;(async () => {
    try {
      const config = store.get(llmProviderConfigAtom)
      const transcripts = task.result?.data ?? []
      const items = await generateOutline(
        transcripts,
        config.modelId,
        config,
        controller.signal,
      )
      if (controller.signal.aborted) return
      updateOutline(taskAtom, () => ({
        status: 'done',
        items,
        generatedAt: Date.now(),
        model,
      }))
    } catch (err) {
      if (controller.signal.aborted) {
        updateOutline(taskAtom, (prev) => ({
          status: 'error',
          items: prev?.items,
          error: 'Aborted',
          model: prev?.model,
          generatedAt: prev?.generatedAt,
        }))
        return
      }
      console.error('[intelligence] outline failed', err)
      updateOutline(taskAtom, (prev) => ({
        status: 'error',
        items: prev?.items,
        error: errorMessage(err),
        model: prev?.model,
        generatedAt: prev?.generatedAt,
      }))
    } finally {
      if (outlineRuns.get(task.id) === controller) {
        outlineRuns.delete(task.id)
      }
    }
  })()
}

export function stopOutline(taskId: string): void {
  const controller = outlineRuns.get(taskId)
  if (!controller) return
  controller.abort()
}

export function startSummary(taskAtom: TaskAtom<TranscribeTask>): void {
  const task = store.get(taskAtom)
  if (summaryRuns.has(task.id)) return

  const controller = new AbortController()
  summaryRuns.set(task.id, controller)

  const model = modelTag()
  updateSummary(taskAtom, () => ({
    status: 'processing',
    content: '',
    model,
  }))

  let latest = ''
  let pendingFlush = false
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    pendingFlush = false
    updateSummary(taskAtom, (prev) => ({
      status: prev?.status ?? 'processing',
      content: latest,
      model,
    }))
  }

  const scheduleFlush = () => {
    if (flushTimer) return
    pendingFlush = true
    flushTimer = setTimeout(() => {
      flushTimer = null
      if (pendingFlush) flush()
    }, SUMMARY_FLUSH_MS)
  }

  const cancelFlush = () => {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    pendingFlush = false
  }

  ;(async () => {
    try {
      const config = store.get(llmProviderConfigAtom)
      const transcripts = task.result?.data ?? []
      const finalContent = await generateSummary(
        transcripts,
        config.modelId,
        config,
        {
          onChunk: (content) => {
            latest = content
            scheduleFlush()
          },
        },
        controller.signal,
      )
      if (controller.signal.aborted) return
      cancelFlush()
      updateSummary(taskAtom, () => ({
        status: 'done',
        content: finalContent,
        generatedAt: Date.now(),
        model,
      }))
    } catch (err) {
      cancelFlush()
      if (controller.signal.aborted) {
        updateSummary(taskAtom, (prev) => ({
          status: 'error',
          content: prev?.content,
          error: 'Aborted',
          model: prev?.model,
          generatedAt: prev?.generatedAt,
        }))
        return
      }
      console.error('[intelligence] summary failed', err)
      updateSummary(taskAtom, (prev) => ({
        status: 'error',
        content: prev?.content,
        error: errorMessage(err),
        model: prev?.model,
        generatedAt: prev?.generatedAt,
      }))
    } finally {
      if (summaryRuns.get(task.id) === controller) {
        summaryRuns.delete(task.id)
      }
    }
  })()
}

export function stopSummary(taskId: string): void {
  const controller = summaryRuns.get(taskId)
  if (!controller) return
  controller.abort()
}

// Rescue any 'processing' intelligence state left behind by a previous session
// (crash / force-quit). Mirrors the task-atom-storage rescue idiom.
export function rescueStaleIntelligence(): void {
  const atoms = store.get(transcribeTaskListAtom)
  for (const a of atoms) {
    const task = store.get(a)
    const outlineStuck = task.outline?.status === 'processing'
    const summaryStuck = task.summary?.status === 'processing'
    if (!outlineStuck && !summaryStuck) continue

    store.set(a, (prev) => ({
      ...prev,
      outline:
        prev.outline?.status === 'processing'
          ? { ...prev.outline, status: 'error', error: 'Interrupted' }
          : prev.outline,
      summary:
        prev.summary?.status === 'processing'
          ? { ...prev.summary, status: 'error', error: 'Interrupted' }
          : prev.summary,
    }))
  }
}
