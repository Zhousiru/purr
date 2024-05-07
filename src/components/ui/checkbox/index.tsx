import { cn } from '@/lib/utils/cn'
import { Checkbox, Field, Label } from '@headlessui/react'
import { IconCheck } from '@tabler/icons-react'
import {
  ComponentPropsWithoutRef,
  ElementRef,
  ReactNode,
  forwardRef,
} from 'react'
import { FieldValues, UseControllerProps, useController } from 'react-hook-form'

const CheckboxPrimitive = forwardRef<
  ElementRef<typeof Checkbox>,
  Omit<ComponentPropsWithoutRef<typeof Checkbox>, 'children'>
>(({ className, ...props }, ref) => {
  return (
    <Checkbox
      ref={ref}
      className={cn(
        'group relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-gray-900 shadow focus-visible:outline-none focus-visible:ring-2',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gray-900 text-white opacity-0 group-data-[checked]:opacity-100">
        {/* Visually... */}
        <IconCheck size={15} />
      </div>
    </Checkbox>
  )
})

CheckboxPrimitive.displayName = 'CheckboxPrimitive'

const LabelCheckbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive> & {
    disabled?: boolean
    children?: ReactNode
  }
>(({ disabled, children, ...props }, ref) => {
  if (children) {
    return (
      <Field
        className={cn(
          'flex items-center',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <CheckboxPrimitive
          {...props}
          ref={ref}
          aria-disabled={disabled}
          className={cn(disabled && 'cursor-default')}
        />
        <Label
          className={cn(
            'cursor-pointer pl-2 text-sm',
            disabled && 'cursor-default',
          )}
          aria-disabled={disabled}
        >
          {children}
        </Label>
      </Field>
    )
  }

  return <CheckboxPrimitive ref={ref} {...props} />
})

LabelCheckbox.displayName = 'Checkbox'

export function FormCheckbox<T extends FieldValues>({
  className,
  ...props
}: UseControllerProps<T> & { className?: string; children?: ReactNode }) {
  const { field } = useController(props)

  return (
    <LabelCheckbox
      name={field.name}
      checked={field.value}
      onChange={(e) => field.onChange(e)}
      disabled={field.disabled}
      onBlur={field.onBlur}
      className={className}
    >
      {props.children}
    </LabelCheckbox>
  )
}

export { CheckboxPrimitive, LabelCheckbox }
