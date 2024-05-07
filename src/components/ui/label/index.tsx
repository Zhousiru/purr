import { cn } from '@/lib/utils/cn'
import { Field, Label as HeadlessLabel } from '@headlessui/react'
import { HTMLAttributes, ReactNode } from 'react'

export function Label({
  text,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { text: ReactNode }) {
  return (
    <Field className={cn('flex flex-col gap-0.5', className)} {...props}>
      <HeadlessLabel>{text}</HeadlessLabel>
      <div className="flex flex-col gap-1">{children}</div>
    </Field>
  )
}
