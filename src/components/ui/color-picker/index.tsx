import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react'
import {
  Fragment,
  PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react'

import {
  clamp01,
  hexToHsv,
  hsvToHex,
  HSV,
  normalizeHex,
} from './color-utils'

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const normalized = normalizeHex(value)

  const [hsv, setHsv] = useState<HSV>(
    () => hexToHsv(normalized) ?? { h: 0, s: 0, v: 0 },
  )
  const [lastExternal, setLastExternal] = useState(normalized)
  const [lastEmitted, setLastEmitted] = useState(normalized)

  if (lastExternal !== normalized) {
    setLastExternal(normalized)
    if (normalized !== lastEmitted) {
      const parsed = hexToHsv(normalized)
      if (parsed) setHsv(parsed)
    }
  }

  function commit(next: HSV) {
    setHsv(next)
    const hex = hsvToHex(next)
    setLastEmitted(hex)
    onChange(hex)
  }

  return (
    <Popover className={cn('relative', className)}>
      <PopoverButton
        className="border-border focus-visible:ring-ring flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Pick color"
      >
        <span
          className="border-border h-5 w-5 rounded border"
          style={{ background: normalized }}
        />
        <span className="font-mono text-xs tracking-wider uppercase">
          {normalized}
        </span>
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 -translate-y-2 scale-95"
        enterTo="opacity-100"
      >
        <PopoverPanel
          anchor={{ to: 'bottom start', gap: 4 }}
          className="border-border bg-card z-10 w-[var(--button-width)] min-w-48 rounded-md border p-2 shadow-md focus:outline-none"
        >
          <SaturationArea
            hue={hsv.h}
            s={hsv.s}
            v={hsv.v}
            onChange={(s, v) => commit({ ...hsv, s, v })}
          />
          <div className="mt-3">
            <HueSlider
              value={hsv.h}
              onChange={(h) => commit({ ...hsv, h })}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className="border-border h-6 w-6 shrink-0 rounded border"
              style={{ background: normalized }}
            />
            <HexInput value={normalized} onChange={onChange} />
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}

function SaturationArea({
  hue,
  s,
  v,
  onChange,
}: {
  hue: number
  s: number
  v: number
  onChange: (s: number, v: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  const updateFromEvent = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const sx = clamp01((clientX - rect.left) / rect.width)
    const sy = clamp01((clientY - rect.top) / rect.height)
    onChange(sx, 1 - sy)
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromEvent(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    updateFromEvent(e.clientX, e.clientY)
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative h-32 w-full cursor-crosshair touch-none rounded select-none"
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, transparent),
          hsl(${hue}, 100%, 50%)
        `,
      }}
    >
      <div
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
      />
    </div>
  )
}

function HueSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (h: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  const updateFromEvent = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp01((clientX - rect.left) / rect.width)
    onChange(x * 360)
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromEvent(e.clientX)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    updateFromEvent(e.clientX)
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative h-3 w-full cursor-ew-resize touch-none rounded-full select-none"
      style={{
        background:
          'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{
          left: `${(value / 360) * 100}%`,
          background: `hsl(${value}, 100%, 50%)`,
        }}
      />
    </div>
  )
}

function HexInput({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const [draft, setDraft] = useState(value.replace(/^#/, ''))
  const [lastSeen, setLastSeen] = useState(value)

  if (lastSeen !== value) {
    setLastSeen(value)
    setDraft(value.replace(/^#/, ''))
  }

  function commit() {
    const normalized = draft.trim()
    if (/^[0-9a-f]{6}$/i.test(normalized)) {
      onChange('#' + normalized.toUpperCase())
    } else {
      setDraft(value.replace(/^#/, ''))
    }
  }

  return (
    <div className="relative flex-1">
      <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">
        #
      </span>
      <Input
        type="text"
        value={draft}
        maxLength={6}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.currentTarget as HTMLInputElement).blur()
          }
        }}
        className="border-border h-8 rounded-md border bg-transparent pl-5 font-mono text-xs tracking-wider uppercase shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
