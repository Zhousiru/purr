'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'
import { TaskStatus, TranscribeTask, TranslateTask } from '@/types/tasks'
import { IconPencil, IconPlayerStop } from '@tabler/icons-react'
import { PrimitiveAtom, useAtom } from 'jotai'
import { useState } from 'react'
import { GhostButton } from './GhostButton'

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

export function TaskItem({
  taskAtom,
}: {
  taskAtom: PrimitiveAtom<TranscribeTask | TranslateTask>
}) {
  const [task, setTask] = useAtom(taskAtom)
  const [showActions, setShowActions] = useState(false)

  function handledebug() {
    setTask({
      ...task,
      group: 'Group 2',
    })
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded border"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" onClick={handledebug}>
            {task.name}
          </div>
          <div
            className={cn(
              'flex gap-1 transition',
              !showActions && 'pointer-events-none opacity-0',
            )}
          >
            <TooltipGroup>
              <Tooltip content="Open in editor">
                <GhostButton icon={<IconPencil />} />
              </Tooltip>

              <Tooltip content="Stop task">
                <GhostButton icon={<IconPlayerStop />} />
              </Tooltip>
            </TooltipGroup>
          </div>
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
