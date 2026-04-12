import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { HTMLAttributes, Ref } from 'react'

type TextCardProps = HTMLAttributes<HTMLDivElement> & {
  start: number
  end: number
  ref?: Ref<HTMLDivElement>
}

export const TextCard = ({
  start,
  end,
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
      <div className="flex flex-col p-4">
        <div className="text-foreground/50 self-start rounded bg-black/5 px-2 font-mono text-xs">
          {formatSec(start)} – {formatSec(end)}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2">{children}</div>
      </div>
    </div>
  )
}
