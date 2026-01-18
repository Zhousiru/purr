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
        'flex h-10 flex-shrink-0 items-center gap-2 rounded-md px-4 text-sm transition',
        !active && 'hover:bg-gray-200',
        active && 'z-10 bg-white shadow',
        className,
      )}
      {...props}
    />
  )
}

export function TabButtonGroup({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="border-b border-gray-200 p-2 text-sm text-gray-400">{title}</div>
      {children}
    </div>
  )
}

TabButtonGroup.Content = TabButtonGroupContent

function TabButtonGroupContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1 p-2', className)}>{children}</div>
  )
}
