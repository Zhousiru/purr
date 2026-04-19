import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { translateTaskListAtom } from '@/atoms/tasks'
import {
  pruneVariation,
  setFlagged,
  toggleViewed,
  useViewState,
} from '@/atoms/viewed-variations'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuItems,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { removeTask, startTask, stopTask } from '@/lib/task-manager'
import { cn } from '@/lib/utils/cn'
import { TranscribeTask, TranslateTask } from '@/types/tasks'
import {
  IconDots,
  IconEye,
  IconEyeOff,
  IconFlag3,
  IconFlag3Filled,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react'
import { useAtomValue } from 'jotai'
import { ComponentProps } from 'react'

export function TranslationsSection() {
  const parent = useCurrentEditingTaskValue()
  const translateAtoms = useAtomValue(translateTaskListAtom)
  const viewState = useViewState(parent.id)

  // Parent-id is set at task creation and never changes — `store.get`
  // is fine for the filter; subscribed reads happen inside ChildRow.
  const children = translateAtoms.filter(
    (a) => store.get(a).parentTaskId === parent.id,
  )

  if (!viewState) return null

  const viewedSet = new Set(viewState.viewed)
  const canHideAny = viewedSet.size > 1

  return (
    <div className="flex flex-col px-2">
      <div className="mb-1 px-2 text-xs font-medium opacity-50">
        Translations
      </div>

      <OriginalRow
        parent={parent}
        viewed={viewedSet.has(parent.id)}
        flagged={viewState.flagged === parent.id}
        canHide={canHideAny}
        onToggleView={() => toggleViewed(parent.id, parent.id)}
        onFlag={() => setFlagged(parent.id, parent.id)}
      />

      {children.map((atom) => (
        <ChildRow
          key={store.get(atom).id}
          parentId={parent.id}
          atom={atom}
          viewedSet={viewedSet}
          flaggedId={viewState.flagged}
          canHideAny={canHideAny}
        />
      ))}
    </div>
  )
}

function RowShell({
  status,
  progress,
  label,
  rightSlot,
}: {
  status: 'done' | 'queued' | 'processing' | 'stopped'
  progress?: number
  label: React.ReactNode
  rightSlot: React.ReactNode
}) {
  return (
    <div className="group flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-black/5">
      <StatusIndicator status={status} progress={progress} />
      <span className="grow truncate">{label}</span>
      <div className="flex items-center gap-0.5">{rightSlot}</div>
    </div>
  )
}

function IconBtn({
  active,
  disabled,
  className,
  ref,
  children,
  ...props
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded hover:bg-black/5',
        active ? 'text-foreground' : 'text-foreground/40 hover:text-foreground',
        disabled && 'pointer-events-none opacity-30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function OriginalRow({
  parent,
  viewed,
  flagged,
  canHide,
  onToggleView,
  onFlag,
}: {
  parent: TranscribeTask
  viewed: boolean
  flagged: boolean
  canHide: boolean
  onToggleView: () => void
  onFlag: () => void
}) {
  const lang = parent.options.language?.trim()
  const label = lang ? `Original (${lang})` : 'Original'

  return (
    <RowShell
      status={parent.status}
      progress={parent.result?.progress}
      label={label}
      rightSlot={
        <>
          <TooltipGroup>
            <Tooltip content={flagged ? '' : 'Set as primary'}>
              <IconBtn
                active={flagged}
                onClick={onFlag}
                className={cn(!flagged && 'opacity-0 group-hover:opacity-100')}
              >
                {flagged ? (
                  <IconFlag3Filled size={14} />
                ) : (
                  <IconFlag3 size={14} />
                )}
              </IconBtn>
            </Tooltip>

            <Tooltip content={viewed ? 'Hide' : 'Show'}>
              <IconBtn
                active={viewed}
                disabled={viewed && !canHide}
                onClick={onToggleView}
              >
                {viewed ? <IconEye size={14} /> : <IconEyeOff size={14} />}
              </IconBtn>
            </Tooltip>
          </TooltipGroup>

          <div className="h-6 w-6" aria-hidden />
        </>
      }
    />
  )
}

function ChildRow({
  parentId,
  atom,
  viewedSet,
  flaggedId,
  canHideAny,
}: {
  parentId: string
  atom: TaskAtom<TranslateTask>
  viewedSet: Set<string>
  flaggedId: string
  canHideAny: boolean
}) {
  const task = useAtomValue(atom)
  const viewed = viewedSet.has(task.id)
  const flagged = flaggedId === task.id

  const canStop = task.status === 'queued' || task.status === 'processing'
  const canStart = task.status === 'stopped'
  const canRemove = task.status === 'stopped' || task.status === 'done'

  return (
    <RowShell
      status={task.status}
      progress={task.result?.progress}
      label={task.options.targetLanguage || 'Translation'}
      rightSlot={
        <>
          <TooltipGroup>
            <Tooltip content={flagged ? '' : 'Set as primary'}>
              <IconBtn
                active={flagged}
                onClick={() => setFlagged(parentId, task.id)}
                className={cn(!flagged && 'opacity-0 group-hover:opacity-100')}
              >
                {flagged ? (
                  <IconFlag3Filled size={14} />
                ) : (
                  <IconFlag3 size={14} />
                )}
              </IconBtn>
            </Tooltip>

            <Tooltip content={viewed ? 'Hide' : 'Show'}>
              <IconBtn
                active={viewed}
                disabled={viewed && !canHideAny}
                onClick={() => toggleViewed(parentId, task.id)}
              >
                {viewed ? <IconEye size={14} /> : <IconEyeOff size={14} />}
              </IconBtn>
            </Tooltip>
          </TooltipGroup>

          <DropdownMenu>
            <DropdownMenuTrigger className="text-foreground/40 hover:text-foreground flex h-6 w-6 items-center justify-center rounded hover:bg-black/5">
              <IconDots size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuItems>
              {canStop && (
                <DropdownMenuItem
                  onClick={() => stopTask('translate', task.id)}
                >
                  <IconPlayerPause size={14} />
                  Pause
                </DropdownMenuItem>
              )}
              {canStart && (
                <DropdownMenuItem
                  onClick={() => startTask('translate', task.id)}
                >
                  <IconPlayerPlay size={14} />
                  Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={!canRemove}
                destructive
                onClick={() => {
                  pruneVariation(parentId, task.id)
                  removeTask('translate', task.id)
                }}
              >
                <IconTrash size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuItems>
          </DropdownMenu>
        </>
      }
    />
  )
}
