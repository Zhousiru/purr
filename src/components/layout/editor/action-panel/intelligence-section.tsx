import { useCurrentEditingTaskValue } from '@/atoms/editor'
import {
  useOutlinePanelOpen,
  useSummaryPanelOpen,
} from '@/atoms/intelligence-panels'
import { useLLMProviderConfig } from '@/atoms/llm-provider'
import { cn } from '@/lib/utils/cn'
import {
  IconFileText,
  IconListDetails,
} from '@tabler/icons-react'
import { ButtonHTMLAttributes } from 'react'

function ToggleButton({
  active,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-black/5 disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-black/5 font-medium',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function IntelligenceSection() {
  const parent = useCurrentEditingTaskValue()
  const [config] = useLLMProviderConfig()
  const [outlineOpen, setOutlineOpen] = useOutlinePanelOpen()
  const [summaryOpen, setSummaryOpen] = useSummaryPanelOpen()

  const hasTranscript = !!parent.result?.data.length
  const hasLLM = !!config.apiKey.trim() && !!config.modelId
  const disabled = !hasTranscript || !hasLLM

  const disabledReason = !hasTranscript
    ? 'Complete a transcription first.'
    : !hasLLM
      ? 'Configure an LLM provider in Settings → LLM Provider.'
      : undefined

  return (
    <div className="flex flex-col px-2">
      <div className="mb-1 px-2 text-xs font-medium opacity-50">
        Intelligence
      </div>
      <ToggleButton
        active={outlineOpen}
        onClick={() => setOutlineOpen((v) => !v)}
        disabled={disabled}
        title={disabledReason}
      >
        <IconListDetails size={16} />
        AI Outline
      </ToggleButton>
      <ToggleButton
        active={summaryOpen}
        onClick={() => setSummaryOpen((v) => !v)}
        disabled={disabled}
        title={disabledReason}
      >
        <IconFileText size={16} />
        Summary
      </ToggleButton>
    </div>
  )
}
