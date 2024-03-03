import { cn } from '@/lib/utils/cn'
import { TablerIconsProps } from '@tabler/icons-react'
import {
  ButtonHTMLAttributes,
  ReactElement,
  cloneElement,
  forwardRef,
} from 'react'

export const GhostButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    icon: ReactElement<TablerIconsProps>
  }
>(function GhostButton({ icon, className, ...props }, ref) {
  const clonedIcon = icon && cloneElement(icon, { size: 16 })

  return (
    <button
      ref={ref}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded hover:bg-black/5',
        className,
      )}
      {...props}
    >
      {clonedIcon}
    </button>
  )
})
