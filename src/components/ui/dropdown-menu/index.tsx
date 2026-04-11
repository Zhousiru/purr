import { cn } from '@/lib/utils/cn'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { ReactNode } from 'react'

export function DropdownMenu({ children }: { children: ReactNode }) {
  return <Menu as="div" className="relative">{children}</Menu>
}

export function DropdownMenuTrigger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <MenuButton className={className}>{children}</MenuButton>
}

export function DropdownMenuItems({
  children,
  className,
  anchor,
}: {
  children: ReactNode
  className?: string
  anchor?: 'bottom end' | 'bottom start' | 'top end' | 'top start'
}) {
  return (
    <MenuItems
      anchor={anchor ?? 'bottom end'}
      className={cn(
        'z-50 min-w-[140px] rounded-lg bg-card py-1 shadow-lg ring-1 ring-ring',
        'origin-top-right transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
        className,
      )}
    >
      {children}
    </MenuItems>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
  className,
  destructive,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  destructive?: boolean
}) {
  return (
    <MenuItem>
      <button
        className={cn(
          'flex w-full items-center gap-2 px-3 py-1.5 text-sm data-[focus]:bg-secondary',
          disabled && 'cursor-not-allowed opacity-40',
          destructive && 'text-destructive',
          className,
        )}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </MenuItem>
  )
}
