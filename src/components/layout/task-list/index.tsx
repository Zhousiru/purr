'use client'

import { taskListAtom } from '@/atoms/tasks'
import { useAtomValue } from 'jotai'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const tasks = useAtomValue(taskListAtom)

  return (
    <div className="flex flex-col gap-2 p-2">
      {tasks.map((t) => (
        <TaskItem key={`${t}`} taskAtom={t} />
      ))}

      <div className="flex h-8 items-center justify-center text-sm font-light text-gray-400">
        {tasks.length === 0
          ? 'No matched tasks'
          : `${tasks.length} matched task(s)`}
      </div>
    </div>
  )
}
