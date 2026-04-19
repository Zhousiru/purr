import { OutlineItem } from '@/types/tasks'

export interface OutlineCallbacks {
  onItems: (items: OutlineItem[]) => void
}

export interface SummaryCallbacks {
  onChunk: (content: string) => void
}
