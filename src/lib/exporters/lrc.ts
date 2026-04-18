import { ExporterContext } from './types'
import { fmtLrc } from './time'

export function exportLrc({ segments, meta }: ExporterContext): string {
  const lines: string[] = []
  if (meta.title) lines.push(`[ti:${meta.title}]`)
  if (meta.language) lines.push(`[la:${meta.language}]`)
  if (lines.length) lines.push('')

  for (const seg of segments) {
    const text = seg.text.replace(/\r?\n/g, ' ')
    lines.push(`${fmtLrc(seg.start)}${text}`)
  }
  return lines.join('\n') + '\n'
}
