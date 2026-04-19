import {
  FloatingDelayGroup,
  FloatingPortal,
  useDelayGroup,
  useMergeRefs,
  useTransitionStyles,
} from '@floating-ui/react'
import {
  HTMLAttributes,
  ReactNode,
  Ref,
  cloneElement,
  isValidElement,
} from 'react'
import { TooltipContext, useTooltip, useTooltipState } from './use-tooltip'

type TooltipTriggerChildProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>
}

type TooltipTriggerProps = TooltipTriggerChildProps & {
  children: ReactNode
}

const TooltipTrigger = ({
  children,
  ref: propRef,
  ...props
}: TooltipTriggerProps) => {
  const state = useTooltipState()

  if (!isValidElement<TooltipTriggerChildProps>(children)) {
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
}

type TooltipContentProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>
}

const TooltipContent = ({ ref: propRef, ...props }: TooltipContentProps) => {
  const state = useTooltipState()
  const { isInstantPhase, currentId } = useDelayGroup(state.context, {
    id: state.context.floatingId,
  })
  const ref = useMergeRefs([state.refs.setFloating, propRef])

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
        className="z-50 rounded-md bg-foreground/80 px-2 py-1 text-xs text-primary-foreground"
        {...state.getFloatingProps(props)}
      />
    </FloatingPortal>
  )
}

export function Tooltip({
  children,
  content,
  ...options
}: { children: ReactNode; content: ReactNode } & Parameters<
  typeof useTooltip
>[0]) {
  const tooltip = useTooltip(options)
  if (!content) return <>{children}</>
  return (
    <TooltipContext.Provider value={tooltip}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipContext.Provider>
  )
}

export function TooltipGroup({ children }: { children: ReactNode }) {
  return (
    <FloatingDelayGroup delay={{ open: 700, close: 100 }}>
      {children}
    </FloatingDelayGroup>
  )
}
