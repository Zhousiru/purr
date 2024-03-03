'use client'

import { taskTypeFilterAtom } from '@/atoms/tasks'
import { IconCircle, IconEar, IconLanguage } from '@tabler/icons-react'
import { useAtom } from 'jotai'
import { TabButton, TabButtonGroup } from './TabButton'

export function TypeFilter() {
  const [filter, setFilter] = useAtom(taskTypeFilterAtom)

  return (
    <TabButtonGroup title="Type">
      <TabButtonGroup.Content>
        <TabButton onClick={() => setFilter('all')} active={filter === 'all'}>
          <IconCircle size={18} />
          All types
        </TabButton>
        <TabButton
          onClick={() => setFilter('transcribe')}
          active={filter === 'transcribe'}
        >
          <IconEar size={18} />
          Transcribe
        </TabButton>
        <TabButton
          onClick={() => setFilter('translate')}
          active={filter === 'translate'}
        >
          <IconLanguage size={18} />
          Translate
        </TabButton>
      </TabButtonGroup.Content>
    </TabButtonGroup>
  )
}
