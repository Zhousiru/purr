import {
  findTaskAtomById,
  setCurrentEditingTaskAtom,
  useCurrentEditingTaskAtomValue,
} from '@/atoms/editor'
import { addRecentlyViewed } from '@/atoms/recently-viewed'
import { ensureViewedAndFlag } from '@/atoms/viewed-variations'
import { Editor } from '@/components/layout/editor'
import { PageHeader } from '@/components/layout/page-header'
import { store } from '@/lib/store'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { TranscribeTask, TranslateTask } from '@/types/tasks'
import { IconEdit } from '@tabler/icons-react'
import { useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

export function EditorPage() {
  const { id } = useSearch({ from: '/editor' })
  const taskAtom = useCurrentEditingTaskAtomValue()

  useEffect(() => {
    if (!id) return
    const found = findTaskAtomById(id)
    if (!found) return
    const task = store.get(found)

    if (task.type === 'transcribe') {
      setCurrentEditingTaskAtom(found as TaskAtom<TranscribeTask>)
    } else {
      const parentId = (task as TranslateTask).parentTaskId
      const parentAtom = findTaskAtomById(parentId)
      if (parentAtom) {
        setCurrentEditingTaskAtom(parentAtom as TaskAtom<TranscribeTask>)
        ensureViewedAndFlag(parentId, id)
      }
    }

    addRecentlyViewed(id)
  }, [id])

  return (
    <div className="flex h-full flex-col">
      <PageHeader>Editor</PageHeader>

      {taskAtom ? <Editor /> : <EmptyState />}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-2 opacity-60">
        <IconEdit size={22} className="text-muted-foreground" />
        <div className="text-muted-foreground text-xs">No task selected</div>
      </div>
    </div>
  )
}
