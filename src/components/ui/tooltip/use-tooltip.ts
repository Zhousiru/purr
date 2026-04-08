import type { Placement } from '@floating-ui/react'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDelayGroup,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { createContext, useContext, useMemo, useState } from 'react'

interface TooltipOptions {
  placement?: Placement
}

export function useTooltip({ placement = 'bottom' }: TooltipOptions = {}) {
  const [open, setOpen] = useState(false)

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip(),
      shift({
        padding: 5,
      }),
    ],
  })

  const context = data.context
  const { delay } = useDelayGroup(context)

  const hover = useHover(context, {
    move: false,
    delay,
  })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const interactions = useInteractions([hover, focus, dismiss, role])

  return useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data],
  )
}

type ContextType = ReturnType<typeof useTooltip> | null

export const TooltipContext = createContext<ContextType>(null)

export function useTooltipState() {
  const context = useContext(TooltipContext)

  if (context === null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />')
  }

  return context
}
