import { LLMProviderConfig, effectiveBaseUrl } from '@/atoms/llm-provider'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { LanguageModel, generateText } from 'ai'

function resolveModel(
  config: LLMProviderConfig,
  modelId: string,
): LanguageModel {
  const raw = effectiveBaseUrl(config).replace(/\/$/, '')
  const baseURL = raw || undefined
  const apiKey = config.apiKey.trim()

  switch (config.provider) {
    case 'openai':
      return createOpenAI({ apiKey, baseURL })(modelId)
    case 'anthropic':
      return createAnthropic({ apiKey, baseURL })(modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey, baseURL })(modelId)
    case 'openai-compatible':
      if (!baseURL) {
        throw new Error('OpenAI-compatible provider requires a base URL.')
      }
      return createOpenAICompatible({
        name: 'openai-compatible',
        apiKey,
        baseURL,
      })(modelId)
  }
}

export async function callLLM(args: {
  system: string
  user: string
  modelId: string
  config: LLMProviderConfig
  signal: AbortSignal
  temperature?: number
}): Promise<string> {
  if (!args.modelId) {
    throw new Error('No model configured. Set a Model ID in Settings → LLM Provider.')
  }
  if (!args.config.apiKey.trim()) {
    throw new Error('No API key configured. Set one in Settings → LLM Provider.')
  }

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
