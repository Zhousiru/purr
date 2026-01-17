import { cn } from '@/lib/utils/cn'
import { IconProps } from '@tabler/icons-react'
import {
  ButtonHTMLAttributes,
  ReactElement,
  Ref,
  cloneElement,
} from 'react'

type GhostButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactElement<IconProps>
  ref?: Ref<HTMLButtonElement>
}

export const GhostButton = ({
  icon,
  className,
  ref,
  ...props
}: GhostButtonProps) => {
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
}
