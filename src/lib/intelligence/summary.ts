import { LLMProviderConfig } from '@/atoms/llm-provider'
import {
  assertLLMConfigured,
  resolveModel,
} from '@/lib/llm/resolve-model'
import { Transcript } from '@/types/tasks'
import { streamText } from 'ai'
import { SummaryCallbacks } from './types'
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryUserPrompt,
  serializeTranscript,
} from './prompt'

export async function generateSummary(
  transcripts: Transcript[],
  modelId: string,
  config: LLMProviderConfig,
  callbacks: SummaryCallbacks,
  signal: AbortSignal,
): Promise<string> {
  assertLLMConfigured(config, modelId)
  if (transcripts.length === 0) return ''

  const model = resolveModel(config, modelId)
  const serialized = serializeTranscript(transcripts)

  const result = streamText({
    model,
    system: SUMMARY_SYSTEM_PROMPT,
    prompt: buildSummaryUserPrompt(serialized),
    abortSignal: signal,
    temperature: 0.3,
  })

  let content = ''
  for await (const delta of result.textStream) {
    content += delta
    callbacks.onChunk(content)
  }

  return content
}
