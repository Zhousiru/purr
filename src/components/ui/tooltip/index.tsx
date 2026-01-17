'use client'

import type { Placement } from '@floating-ui/react'
import {
  FloatingDelayGroup,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDelayGroup,
  useDelayGroupContext,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react'
import {
  HTMLAttributes,
  ReactNode,
  Ref,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  useState,
} from 'react'

interface TooltipOptions {
  placement?: Placement
}

export function useTooltip({ placement = 'bottom' }: TooltipOptions = {}) {
  const { delay } = useDelayGroupContext()
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

const TooltipContext = createContext<ContextType>(null)

export const useTooltipState = () => {
  const context = useContext(TooltipContext)

  if (context === null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />')
  }

  return context
}

export function Tooltip({
  children,
  content,
  ...options
}: { children: ReactNode; content: ReactNode } & TooltipOptions) {
  const tooltip = useTooltip(options)
  return (
    <TooltipContext.Provider value={tooltip}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipContext.Provider>
  )
}

type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }

const TooltipTrigger = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function TooltipTrigger({ children, ...props }, propRef) {
    const state = useTooltipState()

    if (!isValidElement<TriggerProps>(children)) {
      throw new Error('`children` is not a valid element')
    }

    const childrenRef = children.props.ref
    const ref = useMergeRefs([state.refs.setReference, propRef, childrenRef])

    return cloneElement(
      children,
      state.getReferenceProps({
        ref,
        ...props,
        ...children.props,
      }),
    )
  },
)

const TooltipContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function TooltipContent(props, propRef) {
  const state = useTooltipState()
  const { isInstantPhase, currentId } = useDelayGroupContext()
  const ref = useMergeRefs([state.refs.setFloating, propRef])

  useDelayGroup(state.context, { id: state.context.floatingId })

  const instantDuration = 0
  const duration = 150

  const { isMounted, styles } = useTransitionStyles(state.context, {
    duration: isInstantPhase
      ? {
          open: instantDuration,
          close:
            currentId === state.context.floatingId ? duration : instantDuration,
        }
      : duration,
    initial: {
      opacity: 0,
    },
  })

  if (!isMounted) return null

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...state.floatingStyles,
          ...props.style,
          ...styles,
        }}
        className="z-50 rounded-md bg-black/75 px-2 py-1 text-xs text-white"
        {...state.getFloatingProps(props)}
      />
    </FloatingPortal>
  )
})

export function TooltipGroup({ children }: { children: ReactNode }) {
  return (
    <FloatingDelayGroup delay={{ open: 700, close: 100 }}>
      {children}
    </FloatingDelayGroup>
  )
}
