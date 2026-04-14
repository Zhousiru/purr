import { Button } from '@/components/ui/button'
import { LabelCheckbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cmd } from '@/lib/commands'
import { DownloadProgress, DownloadResult, UrlMetadata } from '@/types/commands'
import { IconChevronRight, IconPhoto, IconX } from '@tabler/icons-react'
import { listen } from '@tauri-apps/api/event'
import { downloadDir } from '@tauri-apps/api/path'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { useLayoutEffect, useState } from 'react'

const URL_PATTERN = /^https?:\/\//i

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

interface ProgressBar {
  ext: string
  percent: number
}

export function ImportStep({
  onCancel,
  onStartDownload,
  onComplete,
}: {
  onCancel: () => void
  onStartDownload: () => void
  onComplete: (metadata: UrlMetadata, downloadResult: DownloadResult) => void
}) {
  const [url, setUrl] = useState('')
  const [audioOnly, setAudioOnly] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [metadata, setMetadata] = useState<UrlMetadata | null>(null)
  const [bars, setBars] = useState<ProgressBar[]>([])

  // Clipboard autofill.
  useLayoutEffect(() => {
    let active = true
    readText()
      .then((text) => {
        if (!active) return
        if (text && URL_PATTERN.test(text.trim())) setUrl(text.trim())
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function handleNext() {
    const trimmed = url.trim()
    if (!trimmed) return

    setFetching(true)
    setError(null)

    let meta: UrlMetadata
    try {
      meta = await cmd.fetchUrlMetadata({ url: trimmed })
    } catch (e) {
      setError(String(e))
      setFetching(false)
      return
    }

    // Metadata in hand — commit to the downloading view.
    setMetadata(meta)
    setFetching(false)
    setBars([])
    onStartDownload()

    const unlisten = await listen<DownloadProgress>(
      'app://yt-dlp-download',
      (event) => {
        const { ext, percent } = event.payload
        if (!ext) return
        setBars((prev) => {
          const i = prev.findIndex((b) => b.ext === ext)
          if (i === -1) return [...prev, { ext, percent }]
          const next = prev.slice()
          next[i] = { ext, percent }
          return next
        })
      },
    )

    try {
      const outputDir = (await downloadDir()) + '/purr'
      const result = await cmd.downloadFromUrl({
        url: trimmed,
        outputDir,
        audioOnly,
      })
      onComplete(meta, result)
    } catch (e) {
      const msg = String(e)
      if (msg.toLowerCase().includes('cancelled')) {
        onCancel()
        return
      }
      setError(msg)
    } finally {
      unlisten()
    }
  }

  function handleCancelClick() {
    if (metadata) cmd.cancelDownload().catch(() => {})
    onCancel()
  }

  // After metadata arrives we stay in the downloading view until the flow
  // ends (success, error, or cancel).
  if (metadata) {
    return (
      <div className="flex min-h-[340px] flex-col gap-4">
        <div className="text-lg">Downloading</div>

        <div className="flex gap-3">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt=""
              className="h-22 w-22 shrink-0 rounded-xl bg-black/5 object-cover"
            />
          ) : (
            <div className="flex h-22 w-22 shrink-0 items-center justify-center rounded-xl bg-black/5 text-black/30">
              <IconPhoto size={28} />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
            <div className="line-clamp-2 text-sm leading-snug">
              {metadata.title}
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {metadata.uploader && (
                <span className="truncate">{metadata.uploader}</span>
              )}
              {metadata.uploader && metadata.duration != null && (
                <span aria-hidden>·</span>
              )}
              {metadata.duration != null && (
                <span>{formatDuration(metadata.duration)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {bars.length === 0 && !error && (
            <div className="text-muted-foreground rounded-xl bg-black/5 px-3 py-4 text-center text-xs">
              Starting download…
            </div>
          )}

          {bars.map((bar) => (
            <div key={bar.ext} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium tracking-wide uppercase">
                  {bar.ext}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {bar.percent.toFixed(0)}%
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-foreground h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, Math.max(0, bar.percent))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <div className="grow" />

        <div className="flex justify-end">
          <Button icon={<IconX />} variant="ghost" onClick={handleCancelClick}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[340px] flex-col gap-2">
      <div className="text-lg">Import from URL</div>

      <Input
        type="text"
        placeholder="https://..."
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleNext()
          }
        }}
      />

      <LabelCheckbox checked={audioOnly} onChange={setAudioOnly}>
        Audio only
      </LabelCheckbox>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="grow" />

      <div className="mt-2 flex justify-end gap-1">
        <Button icon={<IconX />} variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          icon={<IconChevronRight />}
          onClick={handleNext}
          loading={fetching}
          disabled={!url.trim()}
        />
      </div>
    </div>
  )
}
