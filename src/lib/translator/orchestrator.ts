import { LLMProviderConfig } from '@/atoms/llm-provider'
import {
  MAX_BATCH_CONCURRENCY,
  MIN_BATCH_CONCURRENCY,
} from '@/constants/translate'
import { TranslateOptions, Translation, Transcript } from '@/types/tasks'
import { callLLM } from './client'
import { findMissingIds, parseTranslationResponse } from './parser'
import {
  PrevContextLine,
  buildSystemPrompt,
  buildUserPrompt,
} from './prompt'

const CONTEXT_LINES = 4

export interface TranslateCallbacks {
  /** Fires each time a translated line is committed. */
  onLine: (t: Translation) => void
  /** ratio in 0..1 for this run. */
  onProgress: (ratio: number) => void
}

interface Line {
  numericId: number
  transcript: Transcript
}

function mapLines(source: Transcript[]): Line[] {
  return source.map((t, i) => ({ numericId: i + 1, transcript: t }))
}

function clampConcurrency(n: number): number {
  if (!Number.isFinite(n)) return MIN_BATCH_CONCURRENCY
  return Math.max(
    MIN_BATCH_CONCURRENCY,
    Math.min(MAX_BATCH_CONCURRENCY, Math.floor(n)),
  )
}

function sliceChunks(lines: Line[], size: number): Line[][] {
  const safeSize = Math.max(1, Math.floor(size))
  const out: Line[][] = []
  for (let i = 0; i < lines.length; i += safeSize) {
    out.push(lines.slice(i, i + safeSize))
  }
  return out
}

export async function translate(
  source: Transcript[],
  options: TranslateOptions,
  config: LLMProviderConfig,
  cbs: TranslateCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const lines = mapLines(source)
  const total = lines.length
  if (total === 0) {
    cbs.onProgress(1)
    return
  }

  const system = buildSystemPrompt(options.targetLanguage, options.prompt)
  const concurrency = clampConcurrency(options.batchConcurrency)
  const chunks = sliceChunks(lines, options.batchSize)

  let completedLines = 0
  const bumpProgress = () => {
    completedLines++
    cbs.onProgress(completedLines / total)
  }

  const commitLine = (line: Line, text: string) => {
    cbs.onLine({ ...line.transcript, translated: text })
    bumpProgress()
  }

  const committed = new Map<number, string>()

  if (concurrency === 1) {
    for (let i = 0; i < chunks.length; i++) {
      if (signal.aborted) throw new DOMException('aborted', 'AbortError')
      const chunk = chunks[i]
      const prev = chunks[i - 1] ?? []
      const prevContext: PrevContextLine[] = prev.slice(-CONTEXT_LINES).map(
        (l) => ({
          numericId: l.numericId,
          original: l.transcript.text,
          translation: committed.get(l.numericId),
        }),
      )
      await translateChunk({
        chunk,
        prevContext,
        withTranslations: true,
        system,
        modelId: options.model || '',
        config,
        signal,
        onLine: (line, text) => {
          committed.set(line.numericId, text)
          commitLine(line, text)
        },
      })
    }
  } else {
    let nextIndex = 0
    const takeIndex = () => {
      if (nextIndex >= chunks.length) return -1
      return nextIndex++
    }

    const worker = async (): Promise<void> => {
      while (true) {
        if (signal.aborted) throw new DOMException('aborted', 'AbortError')
        const i = takeIndex()
        if (i === -1) return
        const chunk = chunks[i]
        const prev = chunks[i - 1] ?? []
        const prevContext: PrevContextLine[] = prev.slice(-CONTEXT_LINES).map(
          (l) => ({
            numericId: l.numericId,
            original: l.transcript.text,
          }),
        )
        await translateChunk({
          chunk,
          prevContext,
          withTranslations: false,
          system,
          modelId: options.model || '',
          config,
          signal,
          onLine: commitLine,
        })
      }
    }

    await Promise.all(
      Array.from({ length: concurrency }, () => worker()),
    )
  }

  cbs.onProgress(1)
}

interface ChunkArgs {
  chunk: Line[]
  prevContext: PrevContextLine[]
  withTranslations: boolean
  system: string
  modelId: string
  config: LLMProviderConfig
  signal: AbortSignal
  onLine: (line: Line, text: string) => void
}

async function translateChunk(args: ChunkArgs): Promise<void> {
  const { chunk, signal, onLine } = args
  if (chunk.length === 0) return
  if (signal.aborted) throw new DOMException('aborted', 'AbortError')

  const range = `${chunk[0].numericId}-${chunk[chunk.length - 1].numericId}`

  const attempt = async (): Promise<Map<number, string> | null> => {
    const userPrompt = buildUserPrompt({
      current: chunk.map((l) => ({
        numericId: l.numericId,
        text: l.transcript.text,
      })),
      prev: args.prevContext,
      withTranslations: args.withTranslations,
    })
    const raw = await callLLM({
      system: args.system,
      user: userPrompt,
      modelId: args.modelId,
      config: args.config,
      signal,
    })
    const parsed = parseTranslationResponse(raw)
    const expected = chunk.map((l) => l.numericId)
    const missing = findMissingIds(expected, parsed)
    if (missing.length === 0) return parsed
    console.warn(
      `[translate] chunk ${range} missing ${missing.length}/${chunk.length} ids: [${missing.join(',')}]`,
    )
    return null
  }

  // 1. Initial call + 2. Verbatim retry
  let parsed = await attempt()
  if (!parsed && !signal.aborted) {
    console.log(`[translate] retry chunk ${range}`)
    parsed = await attempt()
  }

  if (parsed) {
    for (const line of chunk) {
      const text = parsed.get(line.numericId) ?? line.transcript.text
      onLine(line, text)
    }
    return
  }

  // 3. Binary split
  if (chunk.length > 1) {
    console.warn(`[translate] split chunk ${range} after retries`)
    const mid = Math.ceil(chunk.length / 2)
    await translateChunk({ ...args, chunk: chunk.slice(0, mid) })
    await translateChunk({ ...args, chunk: chunk.slice(mid) })
    return
  }

  // 4. Single-line last resort: commit source untranslated.
  console.warn(
    `[translate] fallback line id=${chunk[0].numericId} (committing source)`,
  )
  onLine(chunk[0], chunk[0].transcript.text)
}
