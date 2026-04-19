import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { translateTaskListAtom } from '@/atoms/tasks'
import { store } from '@/lib/store'
import { ExportMeta, ExportSegment } from '@/lib/exporters'
import { TranslateTask, Translation } from '@/types/tasks'
import { atom, useAtomValue } from 'jotai'
import { useMemo } from 'react'

// Fallback atom used by useAtomValue when "Original" is selected — keeps the
// hook-call order stable since we can't conditionally call useAtomValue.
const nullTranslateAtom = atom<TranslateTask | null>(null)

export interface VariationOption {
  id: string
  label: string
}

export function useVariationOptions(): VariationOption[] {
  const parent = useCurrentEditingTaskValue()
  const translateAtoms = useAtomValue(translateTaskListAtom)

  return useMemo(() => {
    const lang = parent.options.language?.trim()
    const originalLabel = lang ? `Original (${lang})` : 'Original'
    const options: VariationOption[] = [
      { id: parent.id, label: originalLabel },
    ]
    for (const atom of translateAtoms) {
      const t = store.get(atom)
      if (t.parentTaskId !== parent.id) continue
      // Only show finished translations — in-progress/stopped ones are
      // incomplete and would produce a partial export.
      if (t.status !== 'done') continue
      options.push({
        id: t.id,
        label: t.options.targetLanguage || 'Translation',
      })
    }
    return options
  }, [parent, translateAtoms])
}

export function useExportSegments(variationId: string): {
  segments: ExportSegment[]
  meta: ExportMeta
} {
  const parent = useCurrentEditingTaskValue()
  const translateAtoms = useAtomValue(translateTaskListAtom)

  const isOriginal = !variationId || variationId === parent.id
  const translateAtom = useMemo(() => {
    if (isOriginal) return null
    return translateAtoms.find((a) => store.get(a).id === variationId) ?? null
  }, [isOriginal, translateAtoms, variationId])

  // Subscribe either to the real translate atom or a stable null-fallback so
  // hook call order stays consistent across variation changes. When the
  // fallback is active the value is `null`.
  const translateTask = useAtomValue(translateAtom ?? nullTranslateAtom)

  return useMemo(() => {
    const sourcePath = parent.options.sourcePath

    if (isOriginal || !translateTask) {
      const data = parent.result?.data ?? []
      const raw = data
        .slice()
        .sort((a, b) => a.start - b.start)
        .filter((d) => d.text.trim().length > 0)

      const segments: ExportSegment[] = raw.map((d, i) => ({
        index: i + 1,
        start: d.start,
        end: d.end,
        text: d.text,
      }))

      return {
        segments,
        meta: {
          title: parent.name,
          language: parent.options.language,
          sourcePath,
        },
      }
    }

    const data = (translateTask.result?.data ?? []) as Translation[]
    const raw = data
      .slice()
      .sort((a, b) => a.start - b.start)
      .filter((d) => (d.translated ?? '').trim().length > 0)

    const segments: ExportSegment[] = raw.map((d, i) => ({
      index: i + 1,
      start: d.start,
      end: d.end,
      text: d.translated,
    }))

    return {
      segments,
      meta: {
        title: `${parent.name} [${translateTask.options.targetLanguage}]`,
        language: translateTask.options.targetLanguage,
        sourcePath,
      },
    }
  }, [parent, translateTask, isOriginal])
}
