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
      className={cn('rounded-lg bg-gray-100 p-4 text-lg', className)}
      {...props}
    >
      <div className="font-mono text-sm opacity-50">
        {formatSec(start)} – {formatSec(end)}
      </div>
      <div>{children}</div>
    </div>
  )
}
