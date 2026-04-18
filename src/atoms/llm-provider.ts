import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type LLMProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openai-compatible'

export type LLMProviderConfig = {
  provider: LLMProviderType
  useCustomBaseUrl: boolean
  baseUrl: string
  apiKey: string
  modelId: string
}

export const DEFAULT_BASE_URL: Record<LLMProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  google: 'https://generativelanguage.googleapis.com',
  'openai-compatible': '',
}

const DEFAULT_CONFIG: LLMProviderConfig = {
  provider: 'openai',
  useCustomBaseUrl: false,
  baseUrl: '',
  apiKey: '',
  modelId: '',
}

export const llmProviderConfigAtom = atomWithStorage<LLMProviderConfig>(
  'settings.llm-provider',
  DEFAULT_CONFIG,
  undefined,
  { getOnInit: true },
)

export const useLLMProviderConfig = () => useAtom(llmProviderConfigAtom)

export function effectiveBaseUrl(config: LLMProviderConfig): string {
  if (config.provider === 'openai-compatible') return config.baseUrl.trim()
  if (config.useCustomBaseUrl && config.baseUrl.trim()) {
    return config.baseUrl.trim()
  }
  return DEFAULT_BASE_URL[config.provider]
}

export type HealthCheckResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export async function runHealthCheck(
  config: LLMProviderConfig,
): Promise<HealthCheckResult> {
  const baseUrl = effectiveBaseUrl(config).replace(/\/$/, '')
  const apiKey = config.apiKey.trim()

  if (!baseUrl) return { ok: false, message: 'Base URL is required' }
  if (!apiKey) return { ok: false, message: 'API key is required' }

  try {
    const { url, init } = buildHealthRequest(config.provider, baseUrl, apiKey)
    const res = await fetch(url, init)
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return {
        ok: false,
        message: `${res.status} ${res.statusText}${detail ? ` — ${truncate(detail, 120)}` : ''}`,
      }
    }
    return { ok: true, message: 'Connection successful' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  }
}

function buildHealthRequest(
  provider: LLMProviderType,
  baseUrl: string,
  apiKey: string,
): { url: string; init: RequestInit } {
  switch (provider) {
    case 'anthropic':
      return {
        url: `${baseUrl}/v1/models`,
        init: {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        },
      }
    case 'google':
      return {
        url: `${baseUrl}/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        init: { method: 'GET' },
      }
    case 'openai':
    case 'openai-compatible':
    default:
      return {
        url: `${baseUrl}/models`,
        init: {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      }
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
