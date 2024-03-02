import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes, ReactNode } from 'react'

export function TabButton({
  className,
  active = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        className,
        'flex h-10 items-center gap-2 rounded-md px-4 transition',
        !active && 'hover:bg-gray-200',
        active && 'z-10 bg-white shadow',
      )}
      {...props}
    />
  )
}

export function TabButtonGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b p-2 text-sm text-gray-400">{title}</div>
      <div className="flex flex-col gap-1 p-2">{children}</div>
    </div>
  )
}
