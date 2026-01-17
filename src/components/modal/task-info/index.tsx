import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { cn } from '@/lib/utils/cn'
import { Task } from '@/types/tasks'
import { IconCheck } from '@tabler/icons-react'
import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'
import { upperFirst } from './utils'

function InfoItem({
  title,
  children,
  noAlign = false,
}: {
  title: string
  children: ReactNode
  noAlign?: boolean
}) {
  return (
    <div className={cn('flex gap-2 text-sm', noAlign && 'items-center gap-1')}>
      <div
        className={cn(
          'flex-shrink-0',
          !noAlign && 'w-[100px] py-[1px] text-right',
        )}
      >
        {noAlign ? (
          <Badge className="border bg-transparent">{title}</Badge>
        ) : (
          <>{title}</>
        )}
      </div>
      {!noAlign && <div className="border-l" />}
      <div
        className={cn(
          'overflow-hidden text-ellipsis py-[1px] text-gray-600',
          noAlign && 'whitespace-nowrap py-0',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function TaskInfoModal({
  isOpen,
  onClose,
  taskAtom,
}: {
  isOpen: boolean
  onClose: (value: boolean) => void
  taskAtom: TaskAtom<Task>
}) {
  const task = useAtomValue(taskAtom)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Info">
      <div className="flex flex-col">
        <InfoItem title="Name">{task.name}</InfoItem>
        <InfoItem title="Group">{task.group}</InfoItem>
        <InfoItem title="Status">{upperFirst(task.status)}</InfoItem>
        <InfoItem title="Creation time">{task.creationTimestamp}</InfoItem>
        <InfoItem title="Type">{upperFirst(task.type)}</InfoItem>
        <InfoItem title="Related task">
          {task.relatedTaskName ?? <span className="italic">None</span>}
        </InfoItem>

        {task.type === 'transcribe' && (
          <>
            <InfoItem title="Source">{task.options.sourcePath}</InfoItem>
            <InfoItem title="Duration">
              {task.options.sourceMeta.duration}
            </InfoItem>
            <InfoItem title="Language">{task.options.language}</InfoItem>
            <InfoItem title="Prompt">{task.options.prompt}</InfoItem>
            <InfoItem title="VAD filter">
              {task.options.vadFilter ? 'Yes' : 'No'}
            </InfoItem>
            {task.options.translateWith && (
              <InfoItem title="Translate with">
                <div className="flex flex-col gap-1">
                  <InfoItem title="Model" noAlign>
                    {task.options.translateWith.model}
                  </InfoItem>
                  <InfoItem title="Prompt" noAlign>
                    {task.options.translateWith.prompt}
                  </InfoItem>
                  <InfoItem title="Batch size" noAlign>
                    {task.options.translateWith.batchSize}
                  </InfoItem>
                </div>
              </InfoItem>
            )}
          </>
        )}

        {task.type === 'translate' && (
          <>
            <InfoItem title="Model">{task.options.model}</InfoItem>
            <InfoItem title="Prompt">{task.options.prompt}</InfoItem>
            <InfoItem title="Batch size">{task.options.batchSize}</InfoItem>
          </>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <Button icon={<IconCheck />} onClick={() => onClose(false)} />
      </div>
    </Modal>
  )
}
