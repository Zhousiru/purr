import { exportAss } from './ass'
import { exportCsv } from './csv'
import { exportJson } from './json'
import { exportLrc } from './lrc'
import { exportSrt } from './srt'
import { exportTxt } from './txt'
import { exportVtt } from './vtt'
import { ExportFormat, FormatDescriptor } from './types'

export { DEFAULT_ASS_STYLE } from './ass'
export type {
  AssStyle,
  ExportFormat,
  ExportMeta,
  ExportSegment,
  ExporterContext,
  FormatDescriptor,
} from './types'

export const FORMATS: readonly FormatDescriptor[] = [
  {
    id: 'vtt',
    label: 'WebVTT',
    extension: 'vtt',
    description: 'Subtitle format for the web.',
    run: exportVtt,
  },
  {
    id: 'lrc',
    label: 'Lyrics',
    extension: 'lrc',
    description: 'Karaoke-style line timestamps.',
    run: exportLrc,
  },
  {
    id: 'srt',
    label: 'SubRip',
    extension: 'srt',
    description: 'Widely supported subtitle format.',
    run: exportSrt,
  },
  {
    id: 'ass',
    label: 'Advanced SubStation',
    extension: 'ass',
    description: 'Styled subtitles with rich formatting.',
    run: exportAss,
  },
  {
    id: 'txt',
    label: 'Plain text',
    extension: 'txt',
    description: 'Text only, one segment per line.',
    run: exportTxt,
  },
  {
    id: 'csv',
    label: 'CSV',
    extension: 'csv',
    description: 'Spreadsheet-friendly table.',
    run: exportCsv,
  },
  {
    id: 'json',
    label: 'JSON',
    extension: 'json',
    description: 'Machine-readable array of segments.',
    run: exportJson,
  },
] as const

export function resolveFormat(id: ExportFormat): FormatDescriptor {
  const desc = FORMATS.find((f) => f.id === id)
  if (!desc) throw new Error(`Unknown export format: ${id}`)
  return desc
}
