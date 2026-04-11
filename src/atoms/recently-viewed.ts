import { findTaskAtomById } from '@/atoms/editor'
import { transcribeTaskListAtom, translateTaskListAtom } from '@/atoms/tasks'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { Task } from '@/types/tasks'
import { useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useMemo } from 'react'

interface RecentlyViewedEntry {
  id: string
  timestamp: number
}

const MAX_ENTRIES = 20

const recentlyViewedAtom = atomWithStorage<RecentlyViewedEntry[]>(
  'recently-viewed',
  [],
  undefined,
  { getOnInit: true },
)

export function addRecentlyViewed(taskId: string) {
  const prev = store.get(recentlyViewedAtom)
  const filtered = prev.filter((e) => e.id !== taskId)
  const next = [{ id: taskId, timestamp: Date.now() }, ...filtered].slice(
    0,
    MAX_ENTRIES,
  )
  store.set(recentlyViewedAtom, next)
}

export function useRecentlyViewedTasks(): TaskAtom<Task>[] {
  const entries = useAtomValue(recentlyViewedAtom)
  // Subscribe to task lists so we re-render after DB hydration
  useAtomValue(transcribeTaskListAtom)
  useAtomValue(translateTaskListAtom)

  return useMemo(() => {
    const result: TaskAtom<Task>[] = []
    for (const entry of entries) {
      const atom = findTaskAtomById(entry.id)
      if (atom) result.push(atom)
    }
    return result
  }, [entries])
}
