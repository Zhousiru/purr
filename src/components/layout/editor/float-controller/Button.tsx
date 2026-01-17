import { cn } from '@/lib/utils/cn'
import { IconProps } from '@tabler/icons-react'
import { ButtonHTMLAttributes, ReactElement, Ref } from 'react'

type FloatButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactElement<IconProps>
  small?: boolean
  ref?: Ref<HTMLButtonElement>
}

export const Button = ({
  icon,
  small = false,
  className,
  ref,
  ...props
}: FloatButtonProps) => {
  return (
    <button
      ref={ref}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-black/10',
        small && 'h-6 w-6',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
