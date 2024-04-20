import { cn } from '@/lib/utils/cn'
import { IconProps } from '@tabler/icons-react'
import { ButtonHTMLAttributes, ReactElement, forwardRef } from 'react'

export const Button = forwardRef<
  HTMLButtonElement,
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    icon: ReactElement<IconProps>
  }
>(function Button({ icon, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-black/10',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
})
