import { cn } from '@/lib/utils/cn'
import { HTMLAttributes } from 'react'

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'border-foreground/20 bg-background text-foreground/70 inline-flex h-4 min-w-4 items-center justify-center rounded border font-mono text-xs',
        className,
      )}
      {...props}
    />
  )
}
