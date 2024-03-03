import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

export function FadeScrollBox({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('scrollbar-none overflow-y-auto pb-[50px]', className)}
      style={{
        maskImage:
          'linear-gradient(to bottom, black calc(100% - 50px), transparent 100%)',
      }}
    >
      {children}
    </div>
  )
}
