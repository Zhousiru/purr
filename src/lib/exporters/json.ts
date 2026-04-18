import { ExporterContext } from './types'

export function exportJson({ segments }: ExporterContext): string {
  const payload = segments.map((seg) => ({
    start: Math.round(seg.start * 1000),
    end: Math.round(seg.end * 1000),
    text: seg.text,
  }))
  return JSON.stringify(payload, null, 2) + '\n'
}
