import {
  useCurrentEditingAudioDurationValue,
  useCurrentEditingAudioPathValue,
  useCurrentEditingLanguageValue,
  useCurrentEditingTaskNameValue,
} from '@/atoms/editor'
import { formatSec } from '@/lib/utils/time'
import { PlaybackControls } from './playback-controls'
import { SubtitlePanel } from './subtitle-panel'
import { VideoPreview } from './video-preview'

export function ActionPanel() {
  const name = useCurrentEditingTaskNameValue()
  const sourcePath = useCurrentEditingAudioPathValue()
  const sourceDuration = useCurrentEditingAudioDurationValue()
  const language = useCurrentEditingLanguageValue()

  return (
    <div className="bg-secondary relative flex h-full flex-col">
      <div className="relative grow">
        <div className="absolute inset-0 flex flex-col gap-2 overflow-auto p-4">
          <div>
            <div className="text-sm font-medium" title={name}>
              {name}
            </div>
          </div>

          <VideoPreview />

          <dl className="flex flex-col gap-2 text-xs">
            <InfoRow label="Path" value={sourcePath} mono />
            <InfoRow
              label="Duration"
              value={formatSec(sourceDuration, false)}
            />
            <InfoRow label="Language" value={language} />
          </dl>
        </div>

        <SubtitlePanel />
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
      <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </dt>
      <dd className={`${mono ? 'font-mono' : ''}`} title={value}>
        {value}
      </dd>
    </div>
  )
}
