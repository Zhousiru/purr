import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <span
      className={cn(
        'flex h-6 items-center rounded-md bg-muted px-2 text-xs',
        className,
      )}
      {...props}
    />
  )
}
