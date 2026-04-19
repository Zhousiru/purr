import {
  useCurrentEditingAudioDurationValue,
  useCurrentEditingAudioPathValue,
  useCurrentEditingLanguageValue,
  useCurrentEditingTaskNameValue,
  useCurrentEditingTaskValue,
} from '@/atoms/editor'
import { ExportSubtitlesModal } from '@/components/modal/export-subtitles'
import { TranslateOptionsModal } from '@/components/modal/translate-options'
import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { IconFileExport, IconLanguage } from '@tabler/icons-react'
import { useState } from 'react'
import { ActionButton } from './action-button'
import { IntelligenceSection } from './intelligence-section'
import { PlaybackControls } from './playback-controls'
import { SubtitlePanel } from './subtitle-panel'
import { TranslationsSection } from './translations-section'
import { VideoPreview } from './video-preview'

export function ActionPanel() {
  const name = useCurrentEditingTaskNameValue()
  const sourcePath = useCurrentEditingAudioPathValue()
  const sourceDuration = useCurrentEditingAudioDurationValue()
  const language = useCurrentEditingLanguageValue()
  const parentTranscribeTask = useCurrentEditingTaskValue()

  const [exportOpen, setExportOpen] = useState(false)
  const [translateOpen, setTranslateOpen] = useState(false)

  const canTranslate = !!parentTranscribeTask.result?.data.length

  const isVideo = !!sourcePath && sourcePath.toLowerCase().endsWith('.mp4')

  return (
    <div className="bg-secondary relative flex h-full flex-col">
      <div className="relative grow">
        <div className="absolute inset-0 flex flex-col gap-4 overflow-auto py-4">
          <div className="px-4">
            <div className="text-sm font-medium" title={name}>
              {name}
            </div>
          </div>

          {isVideo && (
            <div className="relative">
              <VideoPreview />
              <SubtitlePanel />
            </div>
          )}

          <div className="flex flex-col gap-1 px-4 text-xs">
            <div className="text-xs font-medium opacity-50">Metadata</div>
            <dl className="flex flex-col gap-2">
              <InfoRow label="Path" value={sourcePath} mono />
              <InfoRow
                label="Duration"
                value={formatSec(sourceDuration, false)}
              />
              <InfoRow label="Language" value={language} />
            </dl>
          </div>

          <TranslationsSection />

          <IntelligenceSection />

          <div className="flex flex-col px-2">
            <div className="mb-1 px-2 text-xs font-medium opacity-50">
              Actions
            </div>
            <ActionButton onClick={() => setExportOpen(true)}>
              <IconFileExport size={16} />
              Export
            </ActionButton>
            <ActionButton
              onClick={() => setTranslateOpen(true)}
              disabled={!canTranslate}
              title={
                canTranslate
                  ? undefined
                  : 'Complete a transcription first to translate it.'
              }
            >
              <IconLanguage size={16} />
              Translate
            </ActionButton>
          </div>
        </div>

        {!isVideo && <SubtitlePanel />}
      </div>

      <PlaybackControls />

      <ExportSubtitlesModal isOpen={exportOpen} onClose={setExportOpen} />
      <TranslateOptionsModal
        isOpen={translateOpen}
        onClose={setTranslateOpen}
        parentTask={parentTranscribeTask}
      />
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
    <div className="flex flex-col leading-none">
      <dt className="text-foreground/50 text-[9px] tracking-wide uppercase">
        {label}
      </dt>
      <dd
        className={cn('text-xs leading-none', mono && 'font-mono')}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}
