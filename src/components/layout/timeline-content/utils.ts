import { Transcript, Translation } from '@/types/tasks'

export function isTranslation(
  obj: Transcript | Translation,
): obj is Translation {
  return !!(obj as Translation).translated
}

export function getTextCardHeight(line: 1 | 2) {
  return line === 1 ? 80 : 108
}
