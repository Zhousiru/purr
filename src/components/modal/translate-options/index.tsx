import { useLLMProviderConfig } from '@/atoms/llm-provider'
import { ensureViewedAndFlag } from '@/atoms/viewed-variations'
import { Button } from '@/components/ui/button'
import { CompositionInput } from '@/components/ui/composition-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { SUGGESTED_LANGUAGES } from '@/constants/languages'
import {
  DEFAULT_TRANSLATE_OPTIONS,
  MAX_BATCH_CONCURRENCY,
  MAX_BATCH_SIZE,
  MIN_BATCH_CONCURRENCY,
  MIN_BATCH_SIZE,
} from '@/constants/translate'
import { addTranslationTask } from '@/lib/task-manager/utils'
import { TranscribeTask } from '@/types/tasks'
import { IconLanguage, IconX } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}

interface TranslateOptionsModalProps {
  isOpen: boolean
  onClose: (value: boolean) => void
  parentTask: TranscribeTask | null
}

export function TranslateOptionsModal({
  isOpen,
  onClose,
  parentTask,
}: TranslateOptionsModalProps) {
  const [config] = useLLMProviderConfig()

  const [targetLanguage, setTargetLanguage] = useState(
    DEFAULT_TRANSLATE_OPTIONS.targetLanguage,
  )
  const [batchSize, setBatchSize] = useState(
    DEFAULT_TRANSLATE_OPTIONS.batchSize,
  )
  const [batchConcurrency, setBatchConcurrency] = useState(
    DEFAULT_TRANSLATE_OPTIONS.batchConcurrency,
  )
  const [additionalPrompt, setAdditionalPrompt] = useState('')

  const configReady = useMemo(() => {
    const hasKey = config.apiKey.trim().length > 0
    const hasModel = config.modelId.trim().length > 0
    return hasKey && hasModel
  }, [config])

  const canSubmit =
    !!parentTask &&
    targetLanguage.trim().length > 0 &&
    configReady &&
    !!parentTask.result?.data.length

  function handleSubmit() {
    if (!parentTask || !canSubmit) return

    const id = addTranslationTask(parentTask, {
      targetLanguage: targetLanguage.trim(),
      model: config.modelId.trim(),
      prompt: additionalPrompt,
      batchSize: clamp(batchSize, MIN_BATCH_SIZE, MAX_BATCH_SIZE),
      batchConcurrency: clamp(
        batchConcurrency,
        MIN_BATCH_CONCURRENCY,
        MAX_BATCH_CONCURRENCY,
      ),
    })

    ensureViewedAndFlag(parentTask.id, id)
    toast.success('Translation queued')
    onClose(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Translate transcript"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-3">
        <div className="bg-muted text-muted-foreground flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs">
          <span>
            Using{' '}
            <span className="font-medium">{labelOf(config.provider)}</span>
            {config.modelId ? (
              <>
                {' • '}
                <span className="font-mono">{config.modelId}</span>
              </>
            ) : null}
          </span>
          <Link to="/settings" className="underline">
            Configure
          </Link>
        </div>

        <Label text="Target language">
          <CompositionInput
            value={targetLanguage}
            onChange={setTargetLanguage}
            suggestions={SUGGESTED_LANGUAGES}
            placeholder="e.g. English, Japanese, ..."
          />
        </Label>

        <div className="grid grid-cols-2 gap-3">
          <Label text={`Batch size (${MIN_BATCH_SIZE}–${MAX_BATCH_SIZE})`}>
            <Input
              type="number"
              min={MIN_BATCH_SIZE}
              max={MAX_BATCH_SIZE}
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10) || 0)}
            />
          </Label>

          <Label
            text={`Concurrency (${MIN_BATCH_CONCURRENCY}–${MAX_BATCH_CONCURRENCY})`}
          >
            <Input
              type="number"
              min={MIN_BATCH_CONCURRENCY}
              max={MAX_BATCH_CONCURRENCY}
              value={batchConcurrency}
              onChange={(e) =>
                setBatchConcurrency(parseInt(e.target.value, 10) || 0)
              }
            />
          </Label>
        </div>

        <Label text="Additional prompt (optional)">
          <Textarea
            className="field-sizing-content max-h-[25vh] min-h-16 resize-none"
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="e.g. casual tone; preserve product names"
          />
        </Label>

        {!configReady && (
          <div className="text-destructive text-xs">
            Set an API key and Model ID in{' '}
            <Link to="/settings" className="underline">
              Settings → LLM Provider
            </Link>{' '}
            before translating.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          icon={<IconX />}
          onClick={() => onClose(false)}
        >
          Cancel
        </Button>
        <Button
          icon={<IconLanguage />}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Translate
        </Button>
      </div>
    </Modal>
  )
}

function labelOf(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    case 'google':
      return 'Google'
    case 'openai-compatible':
      return 'OpenAI Compatible'
    default:
      return provider
  }
}
