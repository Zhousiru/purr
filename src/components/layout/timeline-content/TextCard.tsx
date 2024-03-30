import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import { HTMLAttributes, forwardRef } from 'react'
import { getTextCardHeight } from './utils'

export const TextCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    start: number
    end: number
    line: 1 | 2
  }
>(function TextCard(
  { start, end, line, children, style, className, ...props },
  ref,
) {
  const cardHeight = getTextCardHeight(line)

  return (
    <div
      ref={ref}
      className={cn('rounded-lg bg-gray-100 p-4 text-lg', className)}
      style={{
        height: cardHeight,
        ...style,
      }}
      {...props}
    >
      <div className="font-mono text-sm opacity-50">
        {formatSec(start)} – {formatSec(end)}
      </div>
      <div>{children}</div>
    </div>
  )
})
