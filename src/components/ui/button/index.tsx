import { cn } from '@/lib/utils/cn'
import { IconProps } from '@tabler/icons-react'
import {
  ButtonHTMLAttributes,
  ReactElement,
  cloneElement,
  forwardRef,
} from 'react'

const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'solid' | 'outline' | 'ghost' | 'destructive'
    loading?: boolean
    icon?: ReactElement<IconProps>
    reverseIcon?: boolean
  }
>(
  (
    {
      variant = 'solid',
      loading = false,
      icon,
      reverseIcon = false,
      disabled,
      children,
      className,
      type,
      ...props
    },
    ref,
  ) => {
    const clonedIcon = icon && cloneElement(icon, { size: 18 })

    return (
      <button
        className={cn(
          'relative inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-3 py-2 text-sm font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'solid' && ' bg-gray-900 text-white  hover:bg-gray-800',
          variant === 'outline' && 'border border-gray-900 hover:bg-gray-100',
          variant === 'ghost' && 'bg-transparent shadow-none hover:bg-gray-100',
          variant === 'destructive' &&
            'border-red-500 bg-red-500/10 hover:bg-red-500/50',
          className,
        )}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center gap-1',
            loading && 'invisible',
          )}
        >
          {!reverseIcon && clonedIcon}
          {children}
          {reverseIcon && clonedIcon}
        </span>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'h-4 w-4 animate-spin rounded-full border-2 border-gray-800 border-t-transparent',
                variant === 'solid' && 'border-white border-t-transparent',
                variant === 'destructive' &&
                  'border-red-500 border-t-transparent',
              )}
            ></div>
          </div>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
