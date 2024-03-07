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
    // TODO: Support `disabled` if necessary.
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
    children?: ReactNode
  }
>(({ children, ...props }, ref) => {
  if (children) {
    return (
      <Switch.Group ref={ref}>
        <div className="flex items-center">
          <CheckboxPrimitive {...props} />
          <Switch.Label className="cursor-pointer pl-2">
            {children}
          </Switch.Label>
        </div>
      </Switch.Group>
    )
  }

  return <CheckboxPrimitive ref={ref} {...props} />
})

Checkbox.displayName = 'Checkbox'

export function FormCheckbox<T extends FieldValues>(
  props: UseControllerProps<T> & { children?: ReactNode },
) {
  const { field } = useController(props)

  return (
    <Checkbox
      name={field.name}
      checked={field.value}
      onChange={(e) => field.onChange(e)}
      onBlur={field.onBlur}
    >
      {props.children}
    </Checkbox>
  )
}

export { Checkbox }
