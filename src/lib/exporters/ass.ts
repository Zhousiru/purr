import { AssStyle, ExporterContext } from './types'
import { fmtAss } from './time'
import { assTextEscape, hexToAssColor } from './escape'

const DEFAULT_ASS_STYLE: AssStyle = {
  fontName: 'Arial',
  fontSize: 48,
  primaryColor: '#FFFFFF',
  outlineColor: '#000000',
  outline: 2,
  shadow: 0,
  bold: false,
  italic: false,
  alignment: 2,
  marginV: 20,
}

export function exportAss(ctx: ExporterContext): string {
  const style = ctx.assStyle ?? DEFAULT_ASS_STYLE

  const scriptInfo = [
    '[Script Info]',
    `Title: ${ctx.meta.title ?? 'Subtitles'}`,
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
  ]

  const styleHeader =
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, ' +
    'OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ' +
    'ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, ' +
    'Alignment, MarginL, MarginR, MarginV, Encoding'

  const styleLine = [
    'Default',
    style.fontName,
    style.fontSize,
    hexToAssColor(style.primaryColor),
    '&H000000FF',
    hexToAssColor(style.outlineColor),
    '&H00000000',
    style.bold ? -1 : 0,
    style.italic ? -1 : 0,
    0,
    0,
    100,
    100,
    0,
    0,
    1,
    style.outline,
    style.shadow,
    style.alignment,
    10,
    10,
    style.marginV,
    1,
  ].join(',')

  const styles = ['[V4+ Styles]', styleHeader, `Style: ${styleLine}`]

  const eventsHeader =
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  const events = ctx.segments.map((seg) => {
    return `Dialogue: 0,${fmtAss(seg.start)},${fmtAss(seg.end)},Default,,0,0,0,,${assTextEscape(seg.text)}`
  })

  return [
    scriptInfo.join('\n'),
    '',
    styles.join('\n'),
    '',
    '[Events]',
    eventsHeader,
    ...events,
    '',
  ].join('\n')
}

export { DEFAULT_ASS_STYLE }
