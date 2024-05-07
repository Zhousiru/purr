import { cn } from '@/lib/utils/cn'
import { Textarea as HeadlessTextarea } from '@headlessui/react'
import { TextareaHTMLAttributes, forwardRef } from 'react'

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <HeadlessTextarea
      className={cn(
        'flex h-9 w-full rounded-md border border-gray-900 bg-transparent px-3 py-1 text-sm shadow transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'

export { Textarea }
