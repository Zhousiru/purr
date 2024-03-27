import { setCurrentEditingTaskAtom } from '@/atoms/editor'
import { TaskInfoModal } from '@/components/modal/task-info'
import { WhisperServerGuardModal } from '@/components/modal/whisper-server-guard'
import { useWhisperServerGuard } from '@/components/modal/whisper-server-guard/use-whisper-server-guard'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { removeTask, startTask, stopTask } from '@/lib/task-manager'
import { cn } from '@/lib/utils/cn'
import { Task } from '@/types/tasks'
import {
  IconInfoCircle,
  IconPencil,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { HTMLAttributes, useState } from 'react'
import { GhostButton } from './GhostButton'
import { useTaskAtomContext } from './TaskAtomContext'

export function TaskActions({
  task,
  isShow,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { task: Task; isShow: boolean }) {
  const router = useRouter()
  const [isTaskInfoOpen, setIsTaskInfoOpen] = useState(false)
  const { register: guardRegister, guard } = useWhisperServerGuard()
  const taskAtom = useTaskAtomContext()

  function handleViewTaskInfo() {
    setIsTaskInfoOpen(true)
  }

  function handleOpenInEditor() {
    setCurrentEditingTaskAtom(taskAtom)
    router.push('/editor')
  }

  function handleStop() {
    stopTask(task.type, task.name)
  }

  function handleStart() {
    guard(() => startTask(task.type, task.name))
  }

  function handleRemove() {
    removeTask(task.type, task.name)
  }

  return (
    <div
      className={cn(
        'flex gap-1 transition',
        !isShow && 'pointer-events-none opacity-0',
        className,
      )}
      {...props}
    >
      <TooltipGroup>
        <Tooltip content="View task info">
          <GhostButton icon={<IconInfoCircle />} onClick={handleViewTaskInfo} />
        </Tooltip>

        <Tooltip content="Open in editor">
          <GhostButton icon={<IconPencil />} onClick={handleOpenInEditor} />
        </Tooltip>

        {(task.status === 'queued' || task.status === 'processing') && (
          <Tooltip content="Stop task">
            <GhostButton icon={<IconPlayerStop />} onClick={handleStop} />
          </Tooltip>
        )}

        {task.status === 'stopped' && (
          <Tooltip content="Start task">
            <GhostButton icon={<IconPlayerPlay />} onClick={handleStart} />
          </Tooltip>
        )}

        {(task.status === 'stopped' || task.status === 'done') && (
          <Tooltip content="Remove task">
            <GhostButton icon={<IconTrash />} onClick={handleRemove} />
          </Tooltip>
        )}
      </TooltipGroup>

      <WhisperServerGuardModal {...guardRegister} />
      <TaskInfoModal
        isOpen={isTaskInfoOpen}
        onClose={setIsTaskInfoOpen}
        taskAtom={taskAtom}
      />
    </div>
  )
}
