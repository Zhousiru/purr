import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { Task, TaskStatus } from '@/types/task'
import { ReactNode } from 'react'

function TaskItemWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded border">
      {children}
    </div>
  )
}

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

export function TaskItem({ data }: { data: Task }) {
  return (
    <TaskItemWrapper>
      <div className="p-4">
        <div className="text-lg font-bold">{data.name}</div>
        <div className="text-sm text-gray-400">{data.group}</div>

        <div className="mt-2 flex items-end gap-2">
          {data.type === 'transcribe' && <Badge>Transcribe</Badge>}
          {data.type === 'translate' && <Badge>Translate</Badge>}
          {data.type === 'transcribe' && data.options.translateWith && (
            <Badge className="border bg-transparent">Then translate</Badge>
          )}
          <ProgressText status={data.status} progress={data.result?.progress} />
        </div>
      </div>

      <Progress status={data.status} progress={data.result?.progress} />
    </TaskItemWrapper>
  )
}
