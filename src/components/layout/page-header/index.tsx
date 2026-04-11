import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

export function PageHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'z-40 flex h-13 items-center bg-card px-4 text-sm font-medium',
        className,
      )}
      {...props}
    />
  )
}
