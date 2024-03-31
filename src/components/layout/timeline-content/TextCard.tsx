import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { HTMLAttributes, forwardRef } from 'react'

export const TextCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    start: number
    end: number
  }
>(function TextCard({ start, end, children, className, ...props }, ref) {
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
})
