import { ExporterContext } from './types'

export function exportTxt({ segments }: ExporterContext): string {
  return segments.map((seg) => seg.text).join('\n') + '\n'
}
