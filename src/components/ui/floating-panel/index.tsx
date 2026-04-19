import { cn } from '@/lib/utils/cn'
import { IconGripVertical, IconX } from '@tabler/icons-react'
import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export interface FloatingPanelPosition {
  x: number
  y: number
}

export interface FloatingPanelProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  headerActions?: ReactNode
  position: FloatingPanelPosition
  onPositionChange: (p: FloatingPanelPosition) => void
  width?: number
  height?: number
  className?: string
  children: ReactNode
}

const MARGIN = 8

function clampPosition(
  p: FloatingPanelPosition,
  panel: { width: number; height: number },
): FloatingPanelPosition {
  const maxX = Math.max(MARGIN, window.innerWidth - panel.width - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - panel.height - MARGIN)
  return {
    x: Math.min(Math.max(MARGIN, p.x), maxX),
    y: Math.min(Math.max(MARGIN, p.y), maxY),
  }
}

export function FloatingPanel({
  open,
  onClose,
  title,
  headerActions,
  position,
  onPositionChange,
  width = 360,
  height = 480,
  className,
  children,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  // Re-clamp when the viewport shrinks so the panel never ends up off-screen.
  useEffect(() => {
    if (!open) return
    const onResize = () => {
      onPositionChange(clampPosition(position, { width, height }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, position, width, height, onPositionChange])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      dragRef.current = {
        pointerId: e.pointerId,
        offsetX: e.clientX - position.x,
        offsetY: e.clientY - position.y,
      }
      setDragging(true)
    },
    [position.x, position.y],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      const next = clampPosition(
        { x: e.clientX - drag.offsetX, y: e.clientY - drag.offsetY },
        { width, height },
      )
      onPositionChange(next)
    },
    [width, height, onPositionChange],
  )

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // no-op
      }
      dragRef.current = null
      setDragging(false)
    },
    [],
  )

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'bg-card fixed z-40 flex flex-col overflow-hidden rounded-lg shadow-xl ring-1 ring-black/10',
        className,
      )}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
      }}
      role="dialog"
      aria-modal={false}
    >
      <div
        className={cn(
          'flex h-9 shrink-0 items-center gap-1 border-b border-black/10 bg-black/[0.02] pr-1 pl-2 select-none',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <IconGripVertical size={14} className="text-foreground/40 shrink-0" />
        <div className="grow truncate text-xs font-medium">{title}</div>
        {headerActions && (
          <div
            className="flex items-center gap-0.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="text-foreground/40 hover:text-foreground flex h-6 w-6 items-center justify-center rounded hover:bg-black/5"
          aria-label="Close"
        >
          <IconX size={14} />
        </button>
      </div>

      <div className="relative grow overflow-hidden">{children}</div>
    </div>
  )
}
