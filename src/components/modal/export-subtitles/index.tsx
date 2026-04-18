import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  AssStyle,
  DEFAULT_ASS_STYLE,
  ExportFormat,
  resolveFormat,
} from '@/lib/exporters'
import { IconFileExport, IconX } from '@tabler/icons-react'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { useLayoutEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AssStyleControls } from './ass-style-controls'
import { FormatList } from './format-list'
import { Preview } from './preview'
import { useExportSegments } from './use-export-segments'

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'subtitles'
}

export function ExportSubtitlesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
}) {
  const [format, setFormat] = useState<ExportFormat>('vtt')
  const [assStyle, setAssStyle] = useState<AssStyle>(DEFAULT_ASS_STYLE)
  const [isWriting, setIsWriting] = useState(false)

  useLayoutEffect(() => {
    if (!isOpen) return
    setFormat('vtt')
    setAssStyle(DEFAULT_ASS_STYLE)
    setIsWriting(false)
  }, [isOpen])

  const { segments, meta } = useExportSegments()

  const previewText = useMemo(() => {
    const desc = resolveFormat(format)
    return desc.run({ segments, meta, assStyle })
  }, [format, segments, meta, assStyle])

  const note = useMemo(() => {
    if (format === 'lrc') {
      return 'LRC has no end timestamps — each line starts at its cue; the next line implicitly ends it.'
    }
    return undefined
  }, [format])

  async function handleExport() {
    const desc = resolveFormat(format)
    const contents = desc.run({ segments, meta, assStyle })
    const defaultName = `${sanitizeFilename(meta.title ?? 'subtitles')}.${desc.extension}`

    setIsWriting(true)
    try {
      const path = await save({
        defaultPath: defaultName,
        filters: [{ name: desc.label, extensions: [desc.extension] }],
      })
      if (!path) return
      await writeTextFile(path, contents)
      toast.success('Exported')
      onClose(false)
    } catch (e) {
      toast.error(`Export failed: ${String(e)}`)
    } finally {
      setIsWriting(false)
    }
  }

  const noData = segments.length === 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export subtitles"
      className="max-w-4xl"
    >
      <div
        className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-3"
        style={{ height: '62vh' }}
      >
        <FormatList value={format} onChange={setFormat} />

        <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
          {format === 'ass' && (
            <AssStyleControls value={assStyle} onChange={setAssStyle} />
          )}
          <Preview text={previewText} note={note} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        <span className="text-muted-foreground mr-auto text-xs">
          {noData
            ? 'No segments available to export.'
            : `${segments.length} segment${segments.length === 1 ? '' : 's'}`}
        </span>
        <Button
          variant="ghost"
          icon={<IconX />}
          onClick={() => onClose(false)}
        >
          Cancel
        </Button>
        <Button
          icon={<IconFileExport />}
          onClick={handleExport}
          loading={isWriting}
          disabled={noData}
        >
          Export
        </Button>
      </div>
    </Modal>
  )
}
