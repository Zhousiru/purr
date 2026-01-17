import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { IconCheck, IconSelector } from '@tabler/icons-react'
import {
  ComponentPropsWithoutRef,
  ElementRef,
  Fragment,
  Ref,
} from 'react'

export interface SelectItem {
  name: string
  key: string
}

type SelectProps = Omit<ComponentPropsWithoutRef<typeof Listbox>, 'children'> & {
  items: SelectItem[]
  ref?: Ref<ElementRef<typeof Listbox>>
}

const Select = ({ items, className, ref, ...props }: SelectProps) => {
  return (
    <Listbox ref={ref} {...props}>
      <div className={className}>
        <ListboxButton className="z-20 flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-900 px-3 py-2 text-sm shadow placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50">
          {({ value }) => (
            <>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {items.find((item) => item.key === value)?.name ?? value}
              </div>
              <IconSelector className="flex-shrink-0" size={18} />
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
            <ListboxOptions className="absolute inset-x-0 top-1 z-10 rounded-md border bg-white p-1 shadow-md">
              {items.map((item) => (
                <ListboxOption
                  key={item.key}
                  value={item.key}
                  className="flex cursor-default items-center justify-between rounded px-2 py-1 hover:bg-gray-100"
                >
                  {({ selected }) => (
                    <>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.name}
                      </div>
                      {selected && (
                        <IconCheck className="flex-shrink-0" size={18} />
                      )}
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
