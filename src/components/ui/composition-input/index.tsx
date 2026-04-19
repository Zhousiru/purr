import { cn } from '@/lib/utils/cn'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from '@headlessui/react'
import { IconSelector } from '@tabler/icons-react'
import { Fragment, useState } from 'react'

interface CompositionInputProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
}

export function CompositionInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: CompositionInputProps) {
  const [query, setQuery] = useState('')

  const filtered =
    query.trim() === ''
      ? suggestions
      : suggestions.filter((s) =>
          s.toLowerCase().includes(query.trim().toLowerCase()),
        )

  return (
    <Combobox
      value={value}
      onChange={(v: string | null) => {
        if (v !== null) onChange(v)
      }}
      immediate
    >
      <div className={cn('relative', className)}>
        <ComboboxInput
          className="border-border placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-9 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          displayValue={(v: string) => v}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <IconSelector size={18} className="text-foreground/60" />
        </ComboboxButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="-translate-y-2 scale-95 opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <ComboboxOptions className="border-border bg-card absolute inset-x-0 top-10 z-10 max-h-64 overflow-auto rounded-md border p-1 shadow-md">
            {filtered.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1 text-sm">
                {query.trim()
                  ? `Using "${query.trim()}" as custom value.`
                  : 'No suggestions.'}
              </div>
            ) : (
              filtered.map((item) => (
                <ComboboxOption
                  key={item}
                  value={item}
                  className={({ focus }) =>
                    cn(
                      'cursor-default rounded px-2 py-1 text-sm',
                      focus && 'bg-muted',
                    )
                  }
                >
                  {item}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  )
}
