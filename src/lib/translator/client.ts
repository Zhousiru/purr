import { LLMProviderConfig } from '@/atoms/llm-provider'
import { assertLLMConfigured, resolveModel } from '@/lib/llm/resolve-model'
import { generateText } from 'ai'

export async function callLLM(args: {
  system: string
  user: string
  modelId: string
  config: LLMProviderConfig
  signal: AbortSignal
  temperature?: number
}): Promise<string> {
  assertLLMConfigured(args.config, args.modelId)

  const model = resolveModel(args.config, args.modelId)
  const result = await generateText({
    model,
    system: args.system,
    prompt: args.user,
    abortSignal: args.signal,
    temperature: args.temperature ?? 0,
  })
  return result.text
}
