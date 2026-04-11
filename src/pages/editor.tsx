import {
  findTaskAtomById,
  setCurrentEditingTaskAtom,
  useCurrentEditingTaskAtomValue,
} from '@/atoms/editor'
import { addRecentlyViewed } from '@/atoms/recently-viewed'
import { Editor } from '@/components/layout/editor'
import { PageHeader } from '@/components/layout/page-header'
import { useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

export function EditorPage() {
  const { id } = useSearch({ from: '/editor' })
  const taskAtom = useCurrentEditingTaskAtomValue()

  useEffect(() => {
    if (id) {
      const found = findTaskAtomById(id)
      if (found) {
        setCurrentEditingTaskAtom(found)
        addRecentlyViewed(id)
      }
    }
  }, [id])

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Editor</PageHeader>

      {taskAtom ? (
        <Editor />
      ) : (
        <div className="flex grow items-center justify-center">
          Please select the task first.
        </div>
      )}
    </div>
  )
}
