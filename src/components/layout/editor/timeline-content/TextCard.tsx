import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { HTMLAttributes, Ref } from 'react'

type TextCardProps = HTMLAttributes<HTMLDivElement> & {
  start: number
  end: number
  compact?: boolean
  ref?: Ref<HTMLDivElement>
}

export const TextCard = ({
  start,
  end,
  compact,
  children,
  className,
  ref,
  ...props
}: TextCardProps) => {
  return (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden rounded-r border border-transparent text-lg',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex',
          compact ? 'flex-row items-center gap-2 px-4 py-2' : 'flex-col p-4',
        )}
      >
        <div
          className={cn(
            'text-foreground/50 shrink-0 rounded bg-black/5 px-2 font-mono text-xs',
            !compact && 'self-start',
          )}
        >
          {formatSec(start)} – {formatSec(end)}
        </div>
        <div
          className={cn(
            'flex min-w-0 flex-1',
            compact ? 'flex-row gap-2' : 'min-h-0 flex-col gap-2',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
