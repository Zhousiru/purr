import {
  MediaSetupSummary,
  useIsMediaReady,
  useMediaSetupSummary,
} from '@/atoms/bin-status'
import { useRecentlyViewedTasks } from '@/atoms/recently-viewed'
import { TaskRow } from '@/components/common/task-row'
import { PageHeader } from '@/components/layout/page-header'
import { NewTaskModal } from '@/components/modal/new-tasks'
import { NewUrlTaskModal } from '@/components/modal/new-url-task'
import { WhisperServerGuardModal } from '@/components/modal/whisper-server-guard'
import { useWhisperServerGuard } from '@/components/modal/whisper-server-guard/use-whisper-server-guard'
import { cmd } from '@/lib/commands'
import { cn } from '@/lib/utils/cn'
import {
  IconAlertTriangle,
  IconLink,
  IconLoader2,
  IconMicrophone,
  IconPlus,
} from '@tabler/icons-react'
import { ReactNode, useState } from 'react'

interface QuickActionCardProps {
  icon: ReactNode
  iconBgClass: string
  iconColorClass: string
  title: string
  description: string
  onClick?: () => void
  comingSoon?: boolean
  disabled?: boolean
  disabledReason?: string
  disabledProgress?: number
  disabledVariant?: 'setup' | 'failed'
  className?: string
}

function QuickActionCard({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  onClick,
  comingSoon,
  disabled,
  disabledReason,
  disabledProgress,
  disabledVariant,
  className,
}: QuickActionCardProps) {
  const isInactive = comingSoon || (disabled && disabledVariant !== 'failed')
  const displayDescription =
    disabled && disabledReason ? disabledReason : description
  const showSpinner = disabled && disabledVariant === 'setup'
  const showWarning = disabled && disabledVariant === 'failed'

  return (
    <button
      onClick={isInactive ? undefined : onClick}
      title={disabled ? disabledReason : undefined}
      className={cn(
        'border-border relative flex flex-col items-start overflow-hidden rounded-xl border p-6 text-left',
        isInactive
          ? 'cursor-default opacity-50'
          : 'hover:border-border hover:bg-secondary cursor-pointer',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          iconBgClass,
        )}
      >
        <span className={iconColorClass}>{icon}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {comingSoon && (
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
            Soon
          </span>
        )}
        {showSpinner && (
          <IconLoader2
            size={12}
            className="text-muted-foreground animate-spin"
          />
        )}
        {showWarning && (
          <IconAlertTriangle size={12} className="text-amber-500" />
        )}
      </div>
      <span className="text-muted-foreground mt-1 text-xs">
        {displayDescription}
      </span>
      {showSpinner && disabledProgress !== undefined && (
        <div className="bg-border absolute right-0 bottom-0 left-0 h-0.5">
          <div
            className="h-full bg-violet-500 transition-[width]"
            style={{ width: `${Math.round(disabledProgress * 100)}%` }}
          />
        </div>
      )}
    </button>
  )
}

function buildSetupReason(summary: MediaSetupSummary): string {
  switch (summary.phase) {
    case 'installing':
      return summary.progress !== undefined
        ? `Setting up media tools… ${Math.round(summary.progress * 100)}%`
        : 'Setting up media tools…'
    case 'updating':
      return summary.progress !== undefined
        ? `Updating media tools… ${Math.round(summary.progress * 100)}%`
        : 'Updating media tools…'
    case 'checking':
      return 'Checking for updates…'
    case 'failed':
      return 'Setup failed. Click to retry.'
    case 'idle':
      return 'Preparing media tools…'
    default:
      return 'Import audio from a web link'
  }
}

export function LaunchpadPage() {
  const [newTaskModal, setNewTaskModal] = useState(false)
  const [newUrlTaskModal, setNewUrlTaskModal] = useState(false)
  const { register: guardRegister, guard } = useWhisperServerGuard()
  const recentlyViewed = useRecentlyViewedTasks()
  const isMediaReady = useIsMediaReady()
  const mediaSummary = useMediaSetupSummary()

  function handleNewTask() {
    guard(() => setNewTaskModal(true))
  }

  function handleNewUrlTask() {
    if (mediaSummary.phase === 'failed' && mediaSummary.failedId) {
      cmd.retryBinary({ id: mediaSummary.failedId }).catch((e) => {
        console.error('[bin-status] retry failed', e)
      })
      return
    }
    if (!isMediaReady) return
    guard(() => setNewUrlTaskModal(true))
  }

  const urlDisabled = !isMediaReady
  const urlVariant: 'setup' | 'failed' | undefined = urlDisabled
    ? mediaSummary.phase === 'failed'
      ? 'failed'
      : 'setup'
    : undefined

  return (
    <div className="flex h-full flex-col">
      <PageHeader>Launchpad</PageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto mt-[20vh] w-full max-w-4xl">
          <div className="grid grid-cols-3 gap-3 px-2">
            <QuickActionCard
              icon={<IconPlus size={20} />}
              iconBgClass="bg-blue-50"
              iconColorClass="text-blue-500"
              title="New Task"
              description="Transcribe audio files from your device"
              onClick={handleNewTask}
            />
            <QuickActionCard
              icon={<IconLink size={20} />}
              iconBgClass="bg-violet-50"
              iconColorClass="text-violet-500"
              title="New Task From URL"
              description="Import audio from a web link"
              onClick={handleNewUrlTask}
              disabled={urlDisabled}
              disabledVariant={urlVariant}
              disabledReason={
                urlDisabled ? buildSetupReason(mediaSummary) : undefined
              }
              disabledProgress={mediaSummary.progress}
            />
            <QuickActionCard
              icon={<IconMicrophone size={20} />}
              iconBgClass="bg-rose-50"
              iconColorClass="text-rose-500"
              title="Live Record"
              description="Record and transcribe live audio"
              comingSoon
              className="hidden" // Temporarily hidden until implemented
            />
          </div>

          {recentlyViewed.length > 0 && (
            <div className="mt-8">
              <div className="px-2 text-xs font-medium opacity-50">
                Recently Viewed
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {recentlyViewed.slice(0, 5).map((taskAtom, i) => (
                  <TaskRow key={i} taskAtom={taskAtom} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <NewTaskModal isOpen={newTaskModal} onClose={setNewTaskModal} />
      <NewUrlTaskModal isOpen={newUrlTaskModal} onClose={setNewUrlTaskModal} />
      <WhisperServerGuardModal {...guardRegister} />
    </div>
  )
}
