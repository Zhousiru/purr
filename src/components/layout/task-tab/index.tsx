'use client'

import { IconSearch } from '@tabler/icons-react'
import { GroupFilter } from './GroupFilter'
import { TabButton } from './TabButton'
import { TypeFilter } from './TypeFilter'

export function TaskTab() {
  return (
    <div className="flex w-[200px] flex-col border-r bg-gray-100">
      <TypeFilter />
      <GroupFilter />

      <TabButton className="m-2 mt-auto">
        <IconSearch size={18} />
        Search
      </TabButton>
    </div>
  )
}
