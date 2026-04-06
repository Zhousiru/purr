'use client'

import { setCurrentEditingTaskAtom } from '@/atoms/editor'
import { taskGroupsAtom, taskListAtom } from '@/atoms/tasks'
import { TaskInfoModal } from '@/components/modal/task-info'
import { WhisperServerGuardModal } from '@/components/modal/whisper-server-guard'
import { useWhisperServerGuard } from '@/components/modal/whisper-server-guard/use-whisper-server-guard'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuItems,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { removeTask, startTask, stopTask } from '@/lib/task-manager'
import { cn } from '@/lib/utils/cn'
import { Task, TaskStatus } from '@/types/tasks'
import {
  IconCheck,
  IconChevronDown,
  IconDots,
  IconInfoCircle,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function TaskRowActions({ taskAtom }: { taskAtom: TaskAtom<Task> }) {
  const task = useAtomValue(taskAtom)
  const [isTaskInfoOpen, setIsTaskInfoOpen] = useState(false)
  const { register: guardRegister, guard } = useWhisperServerGuard()

  const canStop = task.status === 'queued' || task.status === 'processing'
  const canStart = task.status === 'stopped'
  const canRemove = task.status === 'stopped' || task.status === 'done'

  return (
    <>
      <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
        {canStop && (
          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-black/5"
            onClick={(e) => {
              e.stopPropagation()
              stopTask(task.type, task.name)
            }}
          >
            <IconPlayerPause size={14} />
          </button>
        )}

        {canStart && (
          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-black/5"
            onClick={(e) => {
              e.stopPropagation()
              guard(() => startTask(task.type, task.name))
            }}
          >
            <IconPlayerPlay size={14} />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-black/5">
            <IconDots size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuItems>
            <DropdownMenuItem onClick={() => setIsTaskInfoOpen(true)}>
              <IconInfoCircle size={14} />
              Task Info
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => removeTask(task.type, task.name)}
              disabled={!canRemove}
              destructive
            >
              <IconTrash size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuItems>
        </DropdownMenu>
      </div>

      <WhisperServerGuardModal {...guardRegister} />
      <TaskInfoModal
        isOpen={isTaskInfoOpen}
        onClose={setIsTaskInfoOpen}
        taskAtom={taskAtom}
      />
    </>
  )
}

const INDICATOR_SIZE = 16
const INDICATOR_STROKE = 2
const INDICATOR_RADIUS = (INDICATOR_SIZE - INDICATOR_STROKE) / 2
const INDICATOR_CIRCUMFERENCE = 2 * Math.PI * INDICATOR_RADIUS

function StatusIndicator({
  status,
  progress = 0,
}: {
  status: TaskStatus
  progress?: number
}) {
  if (status === 'done') {
    return <IconCheck size={14} className="shrink-0 text-green-500" />
  }

  if (status === 'stopped') {
    return (
      <svg width={INDICATOR_SIZE} height={INDICATOR_SIZE} className="shrink-0">
        <circle
          cx={INDICATOR_SIZE / 2}
          cy={INDICATOR_SIZE / 2}
          r={INDICATOR_RADIUS}
          fill="none"
          strokeWidth={INDICATOR_STROKE}
          className="stroke-black/5"
        />
        <circle
          cx={INDICATOR_SIZE / 2}
          cy={INDICATOR_SIZE / 2}
          r={INDICATOR_RADIUS}
          fill="none"
          strokeWidth={INDICATOR_STROKE}
          className="stroke-gray-300"
          strokeDasharray={INDICATOR_CIRCUMFERENCE}
          strokeDashoffset={
            INDICATOR_CIRCUMFERENCE - (progress / 100) * INDICATOR_CIRCUMFERENCE
          }
          strokeLinecap="round"
          transform={`rotate(-90 ${INDICATOR_SIZE / 2} ${INDICATOR_SIZE / 2})`}
        />
      </svg>
    )
  }

  // processing or queued
  return (
    <svg
      width={INDICATOR_SIZE}
      height={INDICATOR_SIZE}
      className={cn('shrink-0', status === 'queued' && 'animate-pulse')}
    >
      {/* background track */}
      <circle
        cx={INDICATOR_SIZE / 2}
        cy={INDICATOR_SIZE / 2}
        r={INDICATOR_RADIUS}
        fill="none"
        strokeWidth={INDICATOR_STROKE}
        className="stroke-black/5"
      />
      {/* progress arc */}
      <circle
        cx={INDICATOR_SIZE / 2}
        cy={INDICATOR_SIZE / 2}
        r={INDICATOR_RADIUS}
        fill="none"
        strokeWidth={INDICATOR_STROKE}
        className="stroke-blue-400 transition-all"
        strokeDasharray={INDICATOR_CIRCUMFERENCE}
        strokeDashoffset={
          INDICATOR_CIRCUMFERENCE - (progress / 100) * INDICATOR_CIRCUMFERENCE
        }
        strokeLinecap="round"
        transform={`rotate(-90 ${INDICATOR_SIZE / 2} ${INDICATOR_SIZE / 2})`}
      />
    </svg>
  )
}

function TaskRow({ taskAtom }: { taskAtom: TaskAtom<Task> }) {
  const task = useAtomValue(taskAtom)
  const router = useRouter()
  const [isHover, setIsHover] = useState(false)

  function handleClick() {
    setCurrentEditingTaskAtom(taskAtom)
    router.push(`/editor?type=${task.type}&name=${encodeURIComponent(task.name)}`)
  }

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-xl hover:bg-black/5"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={handleClick}
    >
      <div
        className="flex h-9 items-center gap-2 pr-2 pl-2 text-sm"
        style={
          isHover
            ? {
                maskImage:
                  'linear-gradient(to right, black calc(100% - 80px), transparent calc(100% - 50px))',
              }
            : undefined
        }
      >
        <StatusIndicator
          status={task.status}
          progress={task.result?.progress}
        />
        <span className="truncate">{task.name}</span>
      </div>

      {isHover && <TaskRowActions taskAtom={taskAtom} />}
    </div>
  )
}

function TaskGroup({
  group,
  tasks,
}: {
  group: string
  tasks: TaskAtom<Task>[]
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-9 w-full items-center gap-2 px-2 text-sm"
      >
        <IconChevronDown
          size={16}
          className={cn('shrink-0 transition', collapsed && '-rotate-90')}
        />
        <span className="truncate">{group}</span>
      </button>
      {!collapsed && (
        <div className="flex flex-col">
          {tasks.map((taskAtom, i) => (
            <TaskRow key={i} taskAtom={taskAtom} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SidebarTaskList() {
  const groups = useAtomValue(taskGroupsAtom)
  const allTasks = useAtomValue(taskListAtom)

  if (allTasks.length === 0) return null

  const grouped = groups.map((group) => ({
    group,
    tasks: allTasks.filter((a) => store.get(a).group === group),
  }))

  return (
    <div className="mt-4 flex min-h-0 flex-col overflow-y-auto">
      <div className="px-2 text-xs font-medium opacity-50">Tasks</div>
      <div className="mt-1 flex flex-col gap-0.5">
        {grouped.map(({ group, tasks }) =>
          tasks.length > 0 ? (
            <TaskGroup key={group} group={group} tasks={tasks} />
          ) : null,
        )}
      </div>
    </div>
  )
}
