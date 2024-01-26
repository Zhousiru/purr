import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { Task, TaskStatus } from '@/types/task'
import { ReactNode } from 'react'

function TaskItemWrapper({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>
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
          'absolute inset-0 bg-gradient-to-r from-blue-200 to-blue-300 transition',
          status === 'stopped' && 'from-red-200 to-red-300',
          status === 'done' && 'from-green-200 to-green-300',
        )}
        style={{ transform: `translateX(${progress - 100}%)` }}
      ></div>
    </div>
  )
}

export function TaskItem({ data }: { data: Task }) {
  if (data.type === 'transcribe') {
    return (
      <TaskItemWrapper>
        <div className="p-4">
          <div className="text-lg font-bold">{data.name}</div>
          <div className="text-sm text-gray-400">{data.group}</div>

          <div className="mt-2 flex items-end gap-2">
            <Badge>Transcribe</Badge>
            {data.options.translateWith && (
              <Badge className="border bg-transparent">Then translate</Badge>
            )}
            <div className="ml-auto bg-transparent text-xs text-gray-300">
              {data.status === 'done' && 'DONE'}
              {data.status === 'queued' && 'QUEUED'}
              {data.status === 'stopped' && 'STOPPED'}
              {data.status === 'processing' && `${data.result?.progress ?? 0}%`}
            </div>
          </div>
        </div>

        <Progress status={data.status} progress={data.result?.progress} />
      </TaskItemWrapper>
    )
  }
}
