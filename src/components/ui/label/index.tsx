import { cn } from '@/lib/utils/cn'
import { HTMLAttributes, ReactNode } from 'react'

export function Label({
  text,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { text: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)} {...props}>
      <div>{text}</div>
      {children}
    </div>
  )
}
