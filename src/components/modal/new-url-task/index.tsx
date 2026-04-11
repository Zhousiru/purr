import { Button } from '@/components/ui/button'
import { FormCheckbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { Textarea } from '@/components/ui/textarea'
import { newUrlTaskDefaultValues } from '@/constants/new-url-task-form'
import { cmd } from '@/lib/commands'
import { addTaskFromUrl } from '@/lib/task-manager/utils'
import { DownloadProgress, UrlMetadata } from '@/types/commands'
import { NewUrlTask } from '@/types/new-url-task-form'
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import { listen } from '@tauri-apps/api/event'
import { downloadDir } from '@tauri-apps/api/path'
import { useLayoutEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

type Step = 'url' | 'transcription' | 'downloading'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function NewUrlTaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
}) {
  const { register, handleSubmit, control, watch, reset, getValues } =
    useForm<NewUrlTask>({
      defaultValues: newUrlTaskDefaultValues,
    })

  const [currentStep, setCurrentStep] = useState<Step>('url')
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (!isOpen) return
    setCurrentStep('url')
    setMetadata(null)
    setFetching(false)
    setFetchError(null)
    setDownloadProgress(0)
    setDownloadError(null)
    reset()
  }, [isOpen, reset])

  async function handleFetch() {
    const url = getValues('url').trim()
    if (!url) return

    setFetching(true)
    setFetchError(null)
    setMetadata(null)

    try {
      const result = await cmd.fetchUrlMetadata({ url })
      setMetadata(result)
    } catch (e) {
      setFetchError(String(e))
    } finally {
      setFetching(false)
    }
  }

  async function handleDownloadAndCreate(data: NewUrlTask) {
    setCurrentStep('downloading')
    setDownloadProgress(0)
    setDownloadError(null)

    const unlisten = await listen<DownloadProgress>(
      'app://yt-dlp-download',
      (event) => {
        if (event.payload.total > 0) {
          setDownloadProgress(
            (event.payload.downloaded / event.payload.total) * 100,
          )
        }
      },
    )

    try {
      const dir = (await downloadDir()) + '/purr'
      const result = await cmd.downloadAudioFromUrl({
        url: data.url,
        outputDir: dir,
      })

      addTaskFromUrl(
        metadata!.title,
        result.path,
        result.duration,
        data.group,
        data.transcriptionOption,
      )

      onClose(false)
    } catch (e) {
      setDownloadError(String(e))
      setCurrentStep('transcription')
    } finally {
      unlisten()
    }
  }

  const urlValue = watch('url')
  const canProceedUrl = metadata !== null
  const canProceedTranscription = true

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[400px] flex-col gap-2">
        {currentStep === 'url' && (
          <>
            <div className="text-lg">Import from URL</div>

            <div className="flex gap-1">
              <Input
                type="text"
                placeholder="https://..."
                className="flex-1"
                {...register('url')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleFetch()
                  }
                }}
              />
              <Button
                icon={<IconSearch />}
                variant="outline"
                onClick={handleFetch}
                loading={fetching}
                disabled={!urlValue.trim()}
              >
                Fetch
              </Button>
            </div>

            {fetchError && (
              <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {fetchError}
              </div>
            )}

            {metadata && (
              <div className="flex h-9 items-center gap-2 rounded-xl bg-black/5 px-2 text-sm">
                <StatusIndicator status="done" />
                <span className="truncate">{metadata.title}</span>
                {metadata.duration != null && (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {formatDuration(metadata.duration)}
                  </span>
                )}
              </div>
            )}

            {metadata?.uploader && (
              <div className="px-2 text-xs text-muted-foreground">
                {metadata.uploader}
              </div>
            )}

            <div className="grow" />
          </>
        )}

        {currentStep === 'transcription' && (
          <>
            <div className="text-lg">Transcription Options</div>

            <Label text="Task group">
              <Input type="text" className="w-[200px]" {...register('group')} />
            </Label>

            <Label text="Language">
              <FormCheckbox control={control} name="state.autoLanguage">
                Auto detect
              </FormCheckbox>

              {!watch('state.autoLanguage') && (
                <Input
                  type="text"
                  className="w-[200px]"
                  placeholder="e.g. English / Japanese"
                  {...register('transcriptionOption.language')}
                />
              )}
            </Label>

            <Label text="Initial prompt">
              <Textarea
                className="max-h-[25vh] min-h-14"
                {...register('transcriptionOption.prompt')}
              />
            </Label>

            <div className="flex flex-col gap-1">
              <FormCheckbox
                control={control}
                name="transcriptionOption.vadFilter"
              >
                Use VAD filter
              </FormCheckbox>
            </div>

            {downloadError && (
              <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Download failed: {downloadError}
              </div>
            )}
          </>
        )}

        {currentStep === 'downloading' && (
          <>
            <div className="text-lg">Downloading</div>

            <div className="grow flex flex-col items-center justify-center gap-3">
              <div className="flex h-9 w-full items-center gap-2 rounded-xl bg-black/5 px-2 text-sm">
                <StatusIndicator
                  status="processing"
                  progress={downloadProgress}
                />
                <span className="truncate">{metadata?.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
            </div>
          </>
        )}

        <div className="mt-auto flex justify-end gap-1">
          {currentStep === 'transcription' && (
            <Button
              icon={<IconChevronLeft />}
              variant="ghost"
              onClick={() => setCurrentStep('url')}
            >
              Back
            </Button>
          )}

          <Button
            icon={<IconX />}
            variant="ghost"
            onClick={() => onClose(false)}
          >
            Cancel
          </Button>

          {currentStep === 'url' && (
            <Button
              icon={<IconChevronRight />}
              onClick={() => setCurrentStep('transcription')}
              disabled={!canProceedUrl}
            />
          )}

          {currentStep === 'transcription' && (
            <Button
              icon={<IconCheck />}
              onClick={handleSubmit(handleDownloadAndCreate)}
              disabled={!canProceedTranscription}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
