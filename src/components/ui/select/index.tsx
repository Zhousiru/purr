import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { IconCheck, IconSelector } from '@tabler/icons-react'
import { ComponentRef, Fragment, Ref } from 'react'

export interface SelectItem {
  name: string
  key: string
}

type SelectProps<T extends string> = {
  items: readonly SelectItem[]
  value: T
  onChange: (value: T) => void
  className?: string
  disabled?: boolean
  name?: string
  ref?: Ref<ComponentRef<typeof Listbox>>
}

const Select = <T extends string>({
  items,
  className,
  ref,
  ...props
}: SelectProps<T>) => {
  return (
    <Listbox ref={ref} {...props}>
      <div className={className}>
        <ListboxButton className="border-border placeholder:text-muted-foreground z-20 flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
          {({ value }) => (
            <>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {items.find((item) => item.key === value)?.name ?? value}
              </div>
              <IconSelector className="shrink-0" size={18} />
            </>
          )}
        </ListboxButton>

        <div className="relative">
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 -translate-y-2 scale-95"
            enterTo="opacity-100"
          >
            <ListboxOptions className="border-border bg-card absolute inset-x-0 top-1 z-10 rounded-md border p-1 shadow-md">
              {items.map((item) => (
                <ListboxOption
                  key={item.key}
                  value={item.key}
                  className="hover:bg-muted flex cursor-default items-center justify-between rounded px-2 py-1"
                >
                  {({ selected }) => (
                    <>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.name}
                      </div>
                      {selected && <IconCheck className="shrink-0" size={18} />}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </div>
    </Listbox>
  )
}

Select.displayName = 'Select'

export { Select }
