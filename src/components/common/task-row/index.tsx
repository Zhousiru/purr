import { setCurrentEditingTaskAtom } from '@/atoms/editor'
import { addRecentlyViewed } from '@/atoms/recently-viewed'
import { TaskInfoModal } from '@/components/modal/task-info'
import { WhisperServerGuardModal } from '@/components/modal/whisper-server-guard'
import { useWhisperServerGuard } from '@/components/modal/whisper-server-guard/use-whisper-server-guard'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuItems,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { removeTask, startTask, stopTask } from '@/lib/task-manager'
import { Task } from '@/types/tasks'
import {
  IconDots,
  IconInfoCircle,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
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
      <div
        className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2"
        onClick={(e) => e.stopPropagation()}
      >
        {canStop && (
          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-black/5"
            onClick={(e) => {
              e.stopPropagation()
              stopTask(task.type, task.id)
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
              guard(() => startTask(task.type, task.id))
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
              onClick={() => removeTask(task.type, task.id)}
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

export function TaskRow({ taskAtom }: { taskAtom: TaskAtom<Task> }) {
  const task = useAtomValue(taskAtom)
  const navigate = useNavigate()
  const [isHover, setIsHover] = useState(false)

  function handleClick() {
    addRecentlyViewed(task.id)
    setCurrentEditingTaskAtom(taskAtom)
    navigate({ to: '/editor', search: { id: task.id } })
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl hover:bg-black/5"
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
