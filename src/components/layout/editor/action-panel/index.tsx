import {
  useCurrentEditingAudioDurationValue,
  useCurrentEditingAudioPathValue,
  useCurrentEditingLanguageValue,
  useCurrentEditingTaskNameValue,
} from '@/atoms/editor'
import { formatSec } from '@/lib/utils/time'
import { PlaybackControls } from './playback-controls'

export function ActionPanel() {
  const name = useCurrentEditingTaskNameValue()
  const path = useCurrentEditingAudioPathValue()
  const duration = useCurrentEditingAudioDurationValue()
  const language = useCurrentEditingLanguageValue()

  return (
    <div className="bg-secondary flex h-full flex-col">
      <div className="flex min-h-0 grow flex-col gap-4 p-4">
        <div>
          <div
            className="text-foreground truncate text-sm font-medium"
            title={name}
          >
            {name || 'Untitled'}
          </div>
        </div>

        <dl className="flex flex-col gap-2 text-xs">
          <InfoRow label="Path" value={path} mono />
          <InfoRow label="Duration" value={formatSec(duration, false)} />
          <InfoRow label="Language" value={language || '—'} />
        </dl>
      </div>

      <PlaybackControls />
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-[10px] uppercase tracking-wide">
        {label}
      </dt>
      <dd
        className={`text-foreground truncate ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}
