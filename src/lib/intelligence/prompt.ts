import { Transcript } from '@/types/tasks'

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export function serializeTranscript(data: Transcript[]): string {
  return data
    .map((t) => `[${formatTime(t.start)}] ${t.text.trim()}`)
    .join('\n')
}

export const OUTLINE_SYSTEM_PROMPT = [
  'You are an expert at structuring transcripts into navigable outlines.',
  'Given a timestamped transcript, produce an outline of section headings that a reader can use to jump between topics.',
  '',
  'Respond with ONLY a nested markdown bullet list — no prose before or after, no code fences, no extra headings. Each item has this shape:',
  '',
  '    - <timestamp>,<title>',
  '',
  'Where <timestamp> is written as `mm:ss` (or `h:mm:ss` for content over an hour) and <title> never contains a comma. Nesting uses 2-space indentation per level, up to 3 levels deep. Example:',
  '',
  '    - 0:05,Introduction and overview',
  '      - 0:32,Key definitions',
  '      - 1:10,Why this matters',
  '    - 4:12,First major argument',
  '      - 4:40,Supporting evidence',
  '        - 5:05,Related study',
  '    - 9:00,Conclusion',
  '',
  'Guidelines:',
  '- Prefer 5–15 items total across all levels. Fewer for short transcripts, more for long ones.',
  '- Every timestamp must correspond to a real moment near where that section begins (pick it from the prefixes in the transcript).',
  '- Use level 1 for top-level sections, level 2 for sub-sections, level 3 for finer-grained points (only when warranted).',
  '- Titles should be concise (3–10 words), informative, and in the same language as the transcript.',
  '- Do not invent topics that are not in the transcript.',
  '- The first top-level item should start at or near the beginning of the transcript.',
].join('\n')

export function buildOutlineUserPrompt(transcript: string): string {
  return [
    'Transcript (each line prefixed with its start time):',
    '```',
    transcript,
    '```',
    '',
    'Return the outline now as the nested bullet list described above. Output the bullet list and nothing else.',
  ].join('\n')
}

export const SUMMARY_SYSTEM_PROMPT = [
  'You are an expert at summarizing transcripts.',
  'Given a transcript, produce a concise but substantive summary.',
  'Guidelines:',
  '- Write in the same language as the transcript.',
  '- Begin with a 1-2 sentence overview of what the transcript is about.',
  '- Follow with 3-6 short paragraphs covering the key points in the order they appear.',
  '- Omit filler, repetition, and small talk.',
  '- Do not add information that is not in the transcript.',
  '- Do not use markdown headings or bullet lists — write flowing prose separated by blank lines between paragraphs.',
].join('\n')

export function buildSummaryUserPrompt(transcript: string): string {
  return [
    'Transcript:',
    '```',
    transcript,
    '```',
    '',
    'Write the summary now.',
  ].join('\n')
}
