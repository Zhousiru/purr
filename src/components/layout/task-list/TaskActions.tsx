import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { removeTask, startTask, stopTask } from '@/lib/task-manager'
import { cn } from '@/lib/utils/cn'
import { Task } from '@/types/tasks'
import {
  IconPencil,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
} from '@tabler/icons-react'
import { HTMLAttributes } from 'react'
import { GhostButton } from './GhostButton'

export function TaskActions({
  task,
  isShow,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { task: Task; isShow: boolean }) {
  function handleOpenInEditor() {
    // TODO: Open in editor.
    alert('Open in editor')
  }

  function handleStop() {
    stopTask(task.type, task.name)
  }

  function handleStart() {
    startTask(task.type, task.name)
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
    </div>
  )
}
