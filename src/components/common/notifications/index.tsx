import {
  NotificationType,
  removeNotification,
  useNotification,
} from '@/atoms/notifications'
import { cn } from '@/lib/utils/cn'
import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react'

export function NotificationContent({ id }: { id: string }) {
  const n = useNotification(id)
  if (!n) return null
  const { type, title, desc, progress } = n

  return (
    <div className="bg-background pointer-events-auto flex w-80 flex-col gap-1 rounded-xl border border-black/5 p-3 text-sm shadow-lg">
      <div className="flex items-center gap-2">
        <TypeIcon type={type} />
        <div className="flex-1 truncate font-medium">{title}</div>
        <button
          type="button"
          onClick={() => removeNotification(id)}
          className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5"
          aria-label="Dismiss notification"
        >
          <IconX size={14} />
        </button>
      </div>
      {desc && (
        <div className="text-muted-foreground truncate pl-6 text-xs">
          {desc}
        </div>
      )}
      {type === 'progress' && <ProgressBar value={progress} />}
    </div>
  )
}

function TypeIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'progress':
      return (
        <IconLoader2 size={16} className="shrink-0 animate-spin text-blue-400" />
      )
    case 'success':
      return <IconCheck size={16} className="shrink-0 text-green-500" />
    case 'error':
      return <IconAlertCircle size={16} className="shrink-0 text-red-500" />
    case 'info':
      return <IconInfoCircle size={16} className="shrink-0 text-sky-500" />
  }
}

function ProgressBar({ value }: { value: number | undefined }) {
  const known = typeof value === 'number'
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-black/5">
      <div
        className={cn(
          'absolute inset-y-0 left-0 bg-blue-400 transition-[width]',
          !known && 'w-full animate-pulse',
        )}
        style={known ? { width: `${Math.round(value * 100)}%` } : undefined}
      />
    </div>
  )
}
