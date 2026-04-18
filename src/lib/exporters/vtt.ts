import { ExporterContext } from './types'
import { fmtVtt } from './time'

export function exportVtt({ segments, meta }: ExporterContext): string {
  const header = ['WEBVTT']
  if (meta.language) {
    header.push('', `NOTE Language: ${meta.language}`)
  }
  const blocks = segments.map(
    (seg, i) =>
      `${i + 1}\n${fmtVtt(seg.start)} --> ${fmtVtt(seg.end)}\n${seg.text}`,
  )
  return header.join('\n') + '\n\n' + blocks.join('\n\n') + '\n'
}
