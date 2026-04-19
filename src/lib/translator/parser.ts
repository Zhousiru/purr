const LINE_RE = /<\|(\d+)\|>\s*(.*)/

export function parseTranslationResponse(raw: string): Map<number, string> {
  const map = new Map<number, string>()
  for (const rawLine of raw.split(/\r?\n/)) {
    const m = rawLine.match(LINE_RE)
    if (!m) continue
    const id = parseInt(m[1], 10)
    const text = m[2].trim()
    if (!text) continue
    if (map.has(id)) continue
    map.set(id, text)
  }
  return map
}

export function findMissingIds(
  expectedIds: number[],
  parsed: Map<number, string>,
): number[] {
  return expectedIds.filter((id) => !parsed.has(id))
}
