import { LLMProviderConfig, effectiveBaseUrl } from '@/atoms/llm-provider'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { LanguageModel } from 'ai'

export function resolveModel(
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

export function assertLLMConfigured(
  config: LLMProviderConfig,
  modelId: string,
): void {
  if (!modelId) {
    throw new Error(
      'No model configured. Set a Model ID in Settings → LLM Provider.',
    )
  }
  if (!config.apiKey.trim()) {
    throw new Error(
      'No API key configured. Set one in Settings → LLM Provider.',
    )
  }
}
