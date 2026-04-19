export interface PromptLine {
  numericId: number
  text: string
}

export interface PrevContextLine {
  numericId: number
  original: string
  translation?: string
}

export function buildSystemPrompt(
  targetLanguage: string,
  additional: string,
): string {
  const rules = [
    'You are a professional subtitle translation expert.',
    `Translate every line inside <current_chunk> into ${targetLanguage}.`,
    '',
    'Rules:',
    '1. Preserve each <|n|> tag exactly; output "<|n|> <translation>" on its own line, one output line per input line.',
    '2. Never merge, split, reorder, or omit lines — the output line count must equal the input line count.',
    '3. Use <previous_context> only for coherence (pronouns, tense, tone). Do NOT translate it or repeat it in your output.',
    '4. No explanations, no markdown, no quotes, no additional commentary — only the tagged translations.',
  ]
  let out = rules.join('\n')
  const extra = additional.trim()
  if (extra) {
    out += `\n\n<additional_prompt>\n${extra}\n</additional_prompt>`
  }
  return out
}

export function buildUserPrompt(args: {
  current: PromptLine[]
  prev: PrevContextLine[]
  withTranslations: boolean
}): string {
  const parts: string[] = []
  if (args.prev.length > 0) {
    parts.push('<previous_context>')
    for (const line of args.prev) {
      if (args.withTranslations && line.translation !== undefined) {
        parts.push(
          `<|${line.numericId}|> ${line.original} => ${line.translation}`,
        )
      } else {
        parts.push(`<|${line.numericId}|> ${line.original}`)
      }
    }
    parts.push('</previous_context>')
    parts.push('')
  }
  parts.push('<current_chunk>')
  for (const line of args.current) {
    parts.push(`<|${line.numericId}|> ${line.text}`)
  }
  parts.push('</current_chunk>')
  return parts.join('\n')
}
