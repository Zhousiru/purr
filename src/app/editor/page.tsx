'use client'

import { useCurrentEditingTaskAtomValue } from '@/atoms/editor'
import { ClientOnly } from '@/components/common/client-only'
import { Editor } from '@/components/layout/editor'
import { PageHeader } from '@/components/layout/page-header'

export default function Page() {
  const taskAtom = useCurrentEditingTaskAtomValue()

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Editor</PageHeader>

      {taskAtom ? (
        <ClientOnly>
          <Editor />
        </ClientOnly>
      ) : (
        <div className="flex flex-grow items-center justify-center">
          Please select the task first.
        </div>
      )}
    </div>
  )
}
