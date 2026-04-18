import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes } from 'react'

export function ActionButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-black/5 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
