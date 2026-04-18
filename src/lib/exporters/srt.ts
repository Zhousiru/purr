import { ExporterContext } from './types'
import { fmtSrt } from './time'

export function exportSrt({ segments }: ExporterContext): string {
  const blocks = segments.map(
    (seg, i) =>
      `${i + 1}\n${fmtSrt(seg.start)} --> ${fmtSrt(seg.end)}\n${seg.text}`,
  )
  return blocks.join('\n\n') + '\n'
}
