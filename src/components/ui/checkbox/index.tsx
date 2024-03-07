import { cn } from '@/lib/utils/cn'
import { Switch } from '@headlessui/react'
import { IconCheck } from '@tabler/icons-react'
import {
  ComponentPropsWithoutRef,
  ElementRef,
  ReactNode,
  forwardRef,
} from 'react'
import { FieldValues, UseControllerProps, useController } from 'react-hook-form'

const CheckboxPrimitive = forwardRef<
  ElementRef<typeof Switch>,
  Omit<ComponentPropsWithoutRef<typeof Switch>, 'children'>
>(({ className, ...props }, ref) => {
  return (
    <Switch
      ref={ref}
      className={cn(
        'relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-gray-900 shadow focus-visible:outline-none focus-visible:ring-2',
        className,
      )}
      {...props}
    >
      {({ checked }) => (
        <>
          {checked && (
            <div className="absolute inset-0 bg-gray-900 text-white">
              {/* Visually... */}
              <IconCheck size={15} />
            </div>
          )}
        </>
      )}
    </Switch>
  )
})

CheckboxPrimitive.displayName = 'CheckboxPrimitive'

const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive> & {
    disabled?: boolean
    children?: ReactNode
  }
>(({ disabled, children, ...props }, ref) => {
  if (children) {
    return (
      <Switch.Group ref={ref}>
        <div
          className={cn(
            'flex items-center',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <CheckboxPrimitive
            {...props}
            aria-disabled={disabled}
            className={cn(disabled && 'cursor-default')}
          />
          <Switch.Label
            className={cn(
              'cursor-pointer pl-2 text-sm',
              disabled && 'cursor-default',
            )}
            aria-disabled={disabled}
          >
            {children}
          </Switch.Label>
        </div>
      </Switch.Group>
    )
  }

  return <CheckboxPrimitive ref={ref} {...props} />
})

Checkbox.displayName = 'Checkbox'

export function FormCheckbox<T extends FieldValues>({
  className,
  ...props
}: UseControllerProps<T> & { className?: string; children?: ReactNode }) {
  const { field } = useController(props)

  return (
    <Checkbox
      name={field.name}
      checked={field.value}
      onChange={(e) => field.onChange(e)}
      disabled={field.disabled}
      onBlur={field.onBlur}
      className={className}
    >
      {props.children}
    </Checkbox>
  )
}

export { Checkbox }
