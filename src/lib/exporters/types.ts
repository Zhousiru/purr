export type ExportFormat =
  | 'srt'
  | 'vtt'
  | 'ass'
  | 'txt'
  | 'csv'
  | 'lrc'
  | 'json'

export interface ExportSegment {
  index: number
  start: number
  end: number
  text: string
}

export interface AssStyle {
  fontName: string
  fontSize: number
  primaryColor: string
  outlineColor: string
  outline: number
  shadow: number
  bold: boolean
  italic: boolean
  alignment: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  marginV: number
}

export interface ExportMeta {
  title?: string
  language?: string
  sourcePath?: string
}

export interface ExporterContext {
  segments: ExportSegment[]
  meta: ExportMeta
  assStyle?: AssStyle
}

export interface FormatDescriptor {
  id: ExportFormat
  label: string
  extension: string
  description: string
  run: (ctx: ExporterContext) => string
}
