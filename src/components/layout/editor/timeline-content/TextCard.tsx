import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { HTMLAttributes, Ref } from 'react'

type TextCardProps = HTMLAttributes<HTMLDivElement> & {
  start: number
  end: number
  compact?: boolean
  hovered?: boolean
  ref?: Ref<HTMLDivElement>
}

export const TextCard = ({
  start,
  end,
  compact,
  hovered,
  children,
  className,
  ref,
  ...props
}: TextCardProps) => {
  return (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-r border border-transparent text-lg',
        className,
      )}
      {...props}
    >
      {hovered && (
        <div
          className={cn(
            'text-foreground/60 pointer-events-none absolute top-4 right-4 z-10 flex gap-1 text-xs group-focus-within:hidden',
            compact && 'top-1/2 -translate-y-1/2',
          )}
        >
          <Kbd>X</Kbd>
          <span>Delete</span>
        </div>
      )}
      <div
        className={cn(
          'flex',
          compact ? 'h-full items-center gap-2 px-4' : 'flex-col p-4',
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
