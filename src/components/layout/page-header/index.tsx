import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

export function PageHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'z-40 flex h-14 items-center bg-white px-4 text-xl shadow',
        className,
      )}
      {...props}
    />
  )
}
