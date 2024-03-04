'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { Task, TaskStatus } from '@/types/tasks'
import { PrimitiveAtom, useAtomValue } from 'jotai'
import { useState } from 'react'
import { TaskActions } from './TaskActions'

function Progress({
  status,
  progress = 0,
}: {
  status: TaskStatus
  progress?: number
}) {
  return (
    <div
      className={cn(
        'relative h-1 overflow-hidden bg-gray-200',
        status === 'queued' && 'animate-pulse',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-blue-400 transition',
          status === 'stopped' && 'bg-gray-400',
        )}
        style={{ transform: `translateX(${progress - 100}%)` }}
      ></div>
    </div>
  )
}

function ProgressText({
  status,
  progress = 0,
}: {
  status: TaskStatus
  progress?: number
}) {
  return (
    <div className="ml-auto bg-transparent text-xs text-gray-300">
      {status === 'done' && 'DONE'}
      {status === 'queued' && 'QUEUED'}
      {status === 'stopped' && 'STOPPED'}
      {status === 'processing' && `${progress}%`}
    </div>
  )
}

export function TaskItem({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) {
  const task = useAtomValue(taskAtom)

  const [isHover, setIsHover] = useState(false)
  const [isFocusActions, setIsFocusActions] = useState(false)
  const showActions = isHover || isFocusActions

  return (
    <div
      className="flex flex-col overflow-hidden rounded border"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">{task.name}</div>
          <TaskActions
            task={task}
            isShow={showActions}
            onFocus={() => setIsFocusActions(true)}
            onBlur={() => setIsFocusActions(false)}
          />
        </div>
        <div className="text-sm text-gray-400">{task.group}</div>

        <div className="mt-2 flex items-end gap-2">
          {task.type === 'transcribe' && <Badge>Transcribe</Badge>}
          {task.type === 'translate' && <Badge>Translate</Badge>}
          {task.type === 'transcribe' && task.options.translateWith && (
            <Badge className="border bg-transparent">Then translate</Badge>
          )}
          <ProgressText status={task.status} progress={task.result?.progress} />
        </div>
      </div>

      <Progress status={task.status} progress={task.result?.progress} />
    </div>
  )
}
