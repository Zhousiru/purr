import { cn } from '@/lib/utils/cn'
import { Textarea as HeadlessTextarea } from '@headlessui/react'
import { Ref, TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>
}

const Textarea = ({ className, ref, ...props }: TextareaProps) => {
  return (
    <HeadlessTextarea
      className={cn(
        'border-border placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      autoComplete="off"
      {...props}
    />
  )
}

Textarea.displayName = 'Textarea'

export { Textarea }
