import { LLMProviderConfig } from '@/atoms/llm-provider'
import {
  assertLLMConfigured,
  resolveModel,
} from '@/lib/llm/resolve-model'
import { OutlineItem, Transcript } from '@/types/tasks'
import { generateText } from 'ai'
import {
  OUTLINE_SYSTEM_PROMPT,
  buildOutlineUserPrompt,
  serializeTranscript,
} from './prompt'

function snapToSegment(
  timestamp: number,
  sortedStarts: number[],
): number {
  if (sortedStarts.length === 0) return timestamp
  if (timestamp <= sortedStarts[0]) return sortedStarts[0]
  if (timestamp >= sortedStarts[sortedStarts.length - 1]) {
    return sortedStarts[sortedStarts.length - 1]
  }
  let lo = 0
  let hi = sortedStarts.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (sortedStarts[mid] < timestamp) lo = mid + 1
    else hi = mid
  }
  const after = sortedStarts[lo]
  const before = sortedStarts[Math.max(0, lo - 1)]
  return Math.abs(after - timestamp) < Math.abs(timestamp - before)
    ? after
    : before
}

// Accepts "h:mm:ss", "mm:ss", or a raw number of seconds (with optional "s"
// suffix). Returns NaN when unparseable so the caller can skip the line.
function parseTimestamp(raw: string): number {
  const s = raw.trim().replace(/[[\]【】]/g, '').replace(/s$/i, '')
  if (!s) return NaN
  const parts = s.split(':').map((p) => Number(p.trim()))
  if (parts.some((n) => !Number.isFinite(n))) return NaN
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return NaN
}

interface RawOutlineItem {
  title: string
  timestamp: number
  level: 1 | 2 | 3
}

// Parse a markdown-style nested bullet list of outline items, e.g.:
//   - 0:05,Introduction
//     - 0:12,Key definitions
// Indentation (2 spaces or 1 tab per level) maps to heading level 1–3.
function parseOutlineMarkdown(text: string): RawOutlineItem[] {
  const items: RawOutlineItem[] = []
  const lines = text.split(/\r?\n/)

  for (const raw of lines) {
    const match = raw.match(/^([ \t]*)[-*•]\s+(.+?)\s*$/)
    if (!match) continue

    const indent = match[1].replace(/\t/g, '  ').length
    const level = Math.min(3, Math.max(1, Math.floor(indent / 2) + 1)) as 1 | 2 | 3
    const body = match[2]

    const commaIdx = body.search(/[,,]/)
    if (commaIdx < 0) continue

    const timestamp = parseTimestamp(body.slice(0, commaIdx))
    const title = body.slice(commaIdx + 1).trim()
    if (!Number.isFinite(timestamp) || !title) continue

    items.push({ title, timestamp, level })
  }

  return items
}

export async function generateOutline(
  transcripts: Transcript[],
  modelId: string,
  config: LLMProviderConfig,
  signal: AbortSignal,
): Promise<OutlineItem[]> {
  assertLLMConfigured(config, modelId)
  if (transcripts.length === 0) return []

  const model = resolveModel(config, modelId)
  const serialized = serializeTranscript(transcripts)

  const result = await generateText({
    model,
    system: OUTLINE_SYSTEM_PROMPT,
    prompt: buildOutlineUserPrompt(serialized),
    abortSignal: signal,
    temperature: 0.2,
  })

  const parsed = parseOutlineMarkdown(result.text)
  if (parsed.length === 0) {
    throw new Error('Outline response did not contain any recognizable items.')
  }

  const sortedStarts = transcripts.map((t) => t.start).sort((a, b) => a - b)
  return parsed
    .map((item) => ({
      id: crypto.randomUUID(),
      title: item.title.trim(),
      timestamp: snapToSegment(item.timestamp, sortedStarts),
      level: item.level,
    }))
    .filter((item) => item.title.length > 0)
    .sort((a, b) => a.timestamp - b.timestamp)
}
