import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { useViewState } from '@/atoms/viewed-variations'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
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
import {
  useExportSegments,
  useVariationOptions,
} from './use-export-segments'

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
  const parent = useCurrentEditingTaskValue()
  const viewState = useViewState(parent.id)
  const variations = useVariationOptions()

  const [format, setFormat] = useState<ExportFormat>('vtt')
  const [assStyle, setAssStyle] = useState<AssStyle>(DEFAULT_ASS_STYLE)
  const [isWriting, setIsWriting] = useState(false)
  const [variationId, setVariationId] = useState<string>(parent.id)

  useLayoutEffect(() => {
    if (!isOpen) return
    setFormat('vtt')
    setAssStyle(DEFAULT_ASS_STYLE)
    setIsWriting(false)
    // Default to the flagged variation; fall back to parent if it's missing.
    const candidate = viewState?.flagged ?? parent.id
    const exists = variations.some((v) => v.id === candidate)
    setVariationId(exists ? candidate : parent.id)
  }, [isOpen, viewState?.flagged, parent.id, variations])

  const { segments, meta } = useExportSegments(variationId)

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

  const selectItems = variations.map((v) => ({
    key: v.id,
    name: v.label,
  }))

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
        <div className="flex flex-col gap-2">
          <Select
            items={selectItems}
            value={variationId}
            onChange={(v: string) => setVariationId(v)}
          />
          <FormatList value={format} onChange={setFormat} />
        </div>

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
