import {
  useCurrentEditingLanguageValue,
  useCurrentEditingTaskNameValue,
  useCurrentEditingTaskValue,
} from '@/atoms/editor'
import { ExportMeta, ExportSegment } from '@/lib/exporters'
import { useMemo } from 'react'

export function useExportSegments(): {
  segments: ExportSegment[]
  meta: ExportMeta
} {
  const task = useCurrentEditingTaskValue()
  const name = useCurrentEditingTaskNameValue()
  const language = useCurrentEditingLanguageValue()

  return useMemo(() => {
    const data = task.result?.data ?? []
    const sourcePath =
      task.type === 'transcribe' ? task.options.sourcePath : undefined

    const raw = data
      .slice()
      .sort((a, b) => a.start - b.start)
      .filter((d) => {
        const text = pickText(d, task.type)
        return text.trim().length > 0
      })

    const segments: ExportSegment[] = raw.map((d, i) => ({
      index: i + 1,
      start: d.start,
      end: d.end,
      text: pickText(d, task.type),
    }))

    return {
      segments,
      meta: { title: name, language, sourcePath },
    }
  }, [task, name, language])
}

function pickText(
  d: { text: string; translated?: string },
  type: 'transcribe' | 'translate',
): string {
  if (type === 'translate') {
    const t = d.translated?.trim()
    return t ? d.translated! : d.text
  }
  return d.text
}
