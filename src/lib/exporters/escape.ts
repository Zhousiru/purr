export function csvEscape(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function assTextEscape(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '\\N')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
}

export function hexToAssColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '&H00FFFFFF'
  const rr = m[1].slice(0, 2).toUpperCase()
  const gg = m[1].slice(2, 4).toUpperCase()
  const bb = m[1].slice(4, 6).toUpperCase()
  return `&H00${bb}${gg}${rr}`
}
