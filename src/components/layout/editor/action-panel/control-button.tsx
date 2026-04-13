import { cn } from '@/lib/utils/cn'
import { IconProps } from '@tabler/icons-react'
import { ButtonHTMLAttributes, ReactElement, Ref } from 'react'

type ControlButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  icon: ReactElement<IconProps>
  small?: boolean
  ref?: Ref<HTMLButtonElement>
}

export const ControlButton = ({
  icon,
  small = false,
  className,
  ref,
  ...props
}: ControlButtonProps) => {
  return (
    <button
      ref={ref}
      className={cn(
        'text-foreground hover:bg-muted flex h-10 w-10 items-center justify-center rounded-full transition',
        small && 'h-6 w-6',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
