import {
  DEFAULT_BASE_URL,
  HealthCheckResult,
  LLMProviderType,
  runHealthCheck,
  useLLMProviderConfig,
} from '@/atoms/llm-provider'
import { Button } from '@/components/ui/button'
import { LabelCheckbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { forwardRef, useState } from 'react'
import { SectionContainer } from '../SectionContainer'

const PROVIDER_ITEMS = [
  { key: 'openai', name: 'OpenAI' },
  { key: 'anthropic', name: 'Anthropic' },
  { key: 'google', name: 'Google' },
  { key: 'openai-compatible', name: 'OpenAI Compatible' },
]

export const LLMProviderSection = forwardRef<HTMLElement>(
  function LLMProviderSection(_, ref) {
    const [config, setConfig] = useLLMProviderConfig()
    const [checking, setChecking] = useState(false)
    const [result, setResult] = useState<HealthCheckResult | null>(null)

    const isCompat = config.provider === 'openai-compatible'
    const showBaseUrl = isCompat || config.useCustomBaseUrl
    const defaultBase = DEFAULT_BASE_URL[config.provider]

    const update = (patch: Partial<typeof config>) => {
      setConfig((prev) => ({ ...prev, ...patch }))
      setResult(null)
    }

    const handleCheck = async () => {
      setChecking(true)
      setResult(null)
      const r = await runHealthCheck(config)
      setResult(r)
      setChecking(false)
    }

    return (
      <SectionContainer
        ref={ref}
        id="llm-provider"
        title="LLM Provider"
        description="Configure the language model used for AI features."
      >
        <Label text="Provider">
          <Select
            items={PROVIDER_ITEMS}
            value={config.provider}
            onChange={(v: LLMProviderType) =>
              update({
                provider: v,
                // Reset baseUrl when switching to/from openai-compatible so
                // a stale value doesn't leak between provider shapes.
                baseUrl:
                  v === 'openai-compatible' ||
                  config.provider === 'openai-compatible'
                    ? ''
                    : config.baseUrl,
              })
            }
          />
        </Label>

        {!isCompat && (
          <LabelCheckbox
            checked={config.useCustomBaseUrl}
            onChange={(checked: boolean) =>
              update({ useCustomBaseUrl: checked })
            }
          >
            Use custom base URL
          </LabelCheckbox>
        )}

        {showBaseUrl && (
          <Label text="Base URL">
            <Input
              value={config.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder={isCompat ? 'https://...' : defaultBase}
            />
          </Label>
        )}

        <Label text="API Key">
          <Input
            type="password"
            value={config.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </Label>

        <Label text="Model ID">
          <Input
            value={config.modelId}
            onChange={(e) => update({ modelId: e.target.value })}
            placeholder="model-id"
          />
        </Label>

        <div className="flex items-center gap-3 pt-1">
          <Button variant="outline" onClick={handleCheck} loading={checking}>
            Health Check
          </Button>

          {result && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs',
                result.ok ? 'text-green-600' : 'text-destructive',
              )}
            >
              {result.ok ? (
                <IconCheck size={14} />
              ) : (
                <IconAlertCircle size={14} />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>
      </SectionContainer>
    )
  },
)
