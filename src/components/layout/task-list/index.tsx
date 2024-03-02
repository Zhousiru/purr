'use client'

import { taskListAtom } from '@/atoms/tasks'
import { Button } from '@/components/ui/button'
import { addTask } from '@/lib/task-manager'
import { TranscribeOptions } from '@/types/tasks'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const tasks = useAtomValue(taskListAtom)

  const debugCounts = useRef(0)

  function handleDebugAddTask() {
    debugCounts.current++
    addTask(
      'transcribe',
      { name: 'Task ' + debugCounts.current, group: 'Group 1' },
      {} as TranscribeOptions,
    )
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* FIXME: Debug buttons. */}
      <div className="absolute bottom-4 right-4">
        <Button onClick={handleDebugAddTask}>Add</Button>
      </div>

      {tasks.map((t) => (
        <TaskItem key={`${t}`} taskAtom={t} />
      ))}

      <div className="flex h-8 items-center justify-center text-sm font-light text-gray-400">
        {tasks.length === 0 ? 'No tasks' : `${tasks.length} task(s)`}
      </div>
    </div>
  )
}
