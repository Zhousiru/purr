import { cn } from '@/lib/utils/cn'

export function Dot({ className }: { className?: string }) {
  return (
    <div className={cn('h-1.5 w-1.5 rounded-full bg-gray-400', className)} />
  )
}
