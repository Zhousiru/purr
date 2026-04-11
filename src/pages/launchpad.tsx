import { useRecentlyViewedTasks } from '@/atoms/recently-viewed'
import { TaskRow } from '@/components/common/task-row'
import { PageHeader } from '@/components/layout/page-header'
import { NewTaskModal } from '@/components/modal/new-tasks'
import { WhisperServerGuardModal } from '@/components/modal/whisper-server-guard'
import { useWhisperServerGuard } from '@/components/modal/whisper-server-guard/use-whisper-server-guard'
import { cn } from '@/lib/utils/cn'
import { IconLink, IconMicrophone, IconPlus } from '@tabler/icons-react'
import { ReactNode, useState } from 'react'

function QuickActionCard({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  onClick,
  comingSoon,
}: {
  icon: ReactNode
  iconBgClass: string
  iconColorClass: string
  title: string
  description: string
  onClick?: () => void
  comingSoon?: boolean
}) {
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      className={cn(
        'flex flex-col items-start rounded-2xl border border-border p-5 text-left transition',
        comingSoon
          ? 'cursor-default opacity-50'
          : 'cursor-pointer hover:border-border hover:bg-secondary',
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
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Soon
          </span>
        )}
      </div>
      <span className="mt-1 text-xs text-muted-foreground">{description}</span>
    </button>
  )
}

export function LaunchpadPage() {
  const [newTaskModal, setNewTaskModal] = useState(false)
  const { register: guardRegister, guard } = useWhisperServerGuard()
  const recentlyViewed = useRecentlyViewedTasks()

  function handleNewTask() {
    guard(() => setNewTaskModal(true))
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Launchpad</PageHeader>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-3">
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
            comingSoon
          />
          <QuickActionCard
            icon={<IconMicrophone size={20} />}
            iconBgClass="bg-rose-50"
            iconColorClass="text-rose-500"
            title="Live Record"
            description="Record and transcribe live audio"
            comingSoon
          />
        </div>

        {recentlyViewed.length > 0 && (
          <div className="mt-8">
            <div className="px-2 text-xs font-medium opacity-50">
              Recently Viewed
            </div>
            <div className="mt-1 flex flex-col gap-0.5">
              {recentlyViewed.map((taskAtom, i) => (
                <TaskRow key={i} taskAtom={taskAtom} />
              ))}
            </div>
          </div>
        )}
      </div>

      <NewTaskModal isOpen={newTaskModal} onClose={setNewTaskModal} />
      <WhisperServerGuardModal {...guardRegister} />
    </div>
  )
}
