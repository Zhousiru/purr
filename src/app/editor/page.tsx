'use client'

import {
  findTaskAtomByTypeAndName,
  setCurrentEditingTaskAtom,
  useCurrentEditingTaskAtomValue,
} from '@/atoms/editor'
import { ClientOnly } from '@/components/common/client-only'
import { Editor } from '@/components/layout/editor'
import { PageHeader } from '@/components/layout/page-header'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Page() {
  const searchParams = useSearchParams()
  const taskAtom = useCurrentEditingTaskAtomValue()

  useEffect(() => {
    const type = searchParams.get('type')
    const name = searchParams.get('name')
    if (type && name) {
      const found = findTaskAtomByTypeAndName(type, name)
      if (found) {
        setCurrentEditingTaskAtom(found)
      }
    }
  }, [searchParams])

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Editor</PageHeader>

      {taskAtom ? (
        <ClientOnly>
          <Editor />
        </ClientOnly>
      ) : (
        <div className="flex grow items-center justify-center">
          Please select the task first.
        </div>
      )}
    </div>
  )
}
