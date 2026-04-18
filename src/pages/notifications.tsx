import {
  NotificationType,
  useNotification,
  useNotificationIds,
} from '@/atoms/notifications'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils/cn'
import {
  IconAlertCircle,
  IconBellOff,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
} from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'

export function NotificationsPage() {
  const ids = useNotificationIds()
  const ordered = useMemo(() => [...ids].reverse(), [ids])

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <span>Notifications</span>
      </PageHeader>

      {ordered.length === 0 ? <EmptyState /> : <VirtualList ids={ordered} />}
    </div>
  )
}

function VirtualList({ ids }: { ids: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
    // Identity-stable key so per-id measurements survive list reorders
    // (e.g. when a new notification is prepended).
    getItemKey: (index) => ids[index],
  })

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((vi) => (
            <div
              key={vi.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full pb-0.5"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              <NotificationRow id={ids[vi.index]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-2 opacity-60">
        <IconBellOff size={22} className="text-muted-foreground" />
        <div className="text-muted-foreground text-xs">All caught up</div>
      </div>
    </div>
  )
}

function NotificationRow({ id }: { id: string }) {
  const n = useNotification(id)
  if (!n) return null

  const { type, title, desc, progress, lastUpdated } = n
  const { color, icon: Icon } = TYPE_STYLES[type]

  return (
    <div className="relative overflow-hidden rounded-xl px-3 py-2.5 hover:bg-black/5">
      <div className="flex gap-3">
        <div className="pt-0.5">
          <Icon
            size={16}
            className={cn(
              'shrink-0',
              color,
              type === 'progress' && 'animate-spin',
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm">{title}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
              {formatRelativeTime(lastUpdated)}
            </span>
          </div>

          {desc && (
            <div className="text-muted-foreground mt-0.5 truncate text-xs">
              {desc}
            </div>
          )}

          {type === 'progress' && (
            <div className="mt-2 flex items-center gap-2">
              <ProgressBar value={progress} />
              <span className="text-muted-foreground w-9 shrink-0 text-right text-xs tabular-nums">
                {typeof progress === 'number'
                  ? `${Math.round(progress * 100)}%`
                  : '…'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const TYPE_STYLES: Record<
  NotificationType,
  { color: string; icon: typeof IconCheck }
> = {
  progress: { color: 'text-blue-500', icon: IconLoader2 },
  success: { color: 'text-green-500', icon: IconCheck },
  error: { color: 'text-red-500', icon: IconAlertCircle },
  info: { color: 'text-sky-500', icon: IconInfoCircle },
}

function ProgressBar({ value }: { value: number | undefined }) {
  const known = typeof value === 'number'
  return (
    <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
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

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
