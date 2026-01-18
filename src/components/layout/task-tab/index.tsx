'use client'

import { GroupFilter } from './GroupFilter'
import { TypeFilter } from './TypeFilter'

export function TaskTab() {
  return (
    <div className="flex w-[200px] flex-col border-r border-gray-200 bg-gray-100">
      <TypeFilter />
      <GroupFilter />
    </div>
  )
}
