import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

export function PageHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'z-20 flex h-14 items-center px-4 text-xl shadow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
