import { ExporterContext } from './types'
import { csvEscape } from './escape'

export function exportCsv({ segments }: ExporterContext): string {
  const rows = [['index', 'start', 'end', 'text'].join(',')]
  for (const seg of segments) {
    rows.push(
      [
        seg.index,
        seg.start.toFixed(3),
        seg.end.toFixed(3),
        csvEscape(seg.text),
      ].join(','),
    )
  }
  return rows.join('\r\n') + '\r\n'
}
