import { Transcript, Translation } from '@/types/tasks'

export function isTranslation(
  obj: Transcript | Translation,
): obj is Translation {
  return !!(obj as Translation).translated
}
