import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import {
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { seekTime } from './utils'

export interface HoverLayerRef {
  updateBounding: (rect: DOMRect) => void
  updateMouse: (x: number, y: number) => void
  updateOffset: (y: number) => void
  setIsHover: Dispatch<SetStateAction<boolean>>
}

export const HoverLayer = forwardRef<HoverLayerRef>(
  function HoverLayer(_, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const indicatorRef = useRef<HTMLDivElement>(null)

    const offsetRef = useRef(0)

    const [showIndicator, setShowIndicator] = useState(false)

    useImperativeHandle(
      ref,
      () => ({
        updateBounding(rect) {
          containerRef.current!.style.top = rect.top + 'px'
          containerRef.current!.style.left = rect.left + 'px'
          containerRef.current!.style.width = rect.width + 'px'
          containerRef.current!.style.height = rect.height + 'px'
        },
        updateMouse(_, y) {
          const height = y - containerRef.current!.getBoundingClientRect().top
          indicatorRef.current!.style.top = height + 'px'
        },
        updateOffset(y) {
          offsetRef.current = y
        },
        setIsHover: setShowIndicator,
      }),
      [],
    )

    const handleSeek: MouseEventHandler<HTMLButtonElement> = (ev) => {
      const height =
        ev.clientY -
        containerRef.current!.getBoundingClientRect().top +
        offsetRef.current

      player.seek(seekTime(height))
      player.play()
    }

    return (
      <div ref={containerRef} className="pointer-events-none fixed z-50">
        <div
          ref={indicatorRef}
          className={cn('absolute inset-x-0', !showIndicator && 'opacity-0')}
        >
          <div className="border-t border-dashed border-blue-500" />
          <button
            className={cn(
              'absolute right-6 -translate-y-1/2 rounded-md bg-blue-500 px-2 py-1',
              showIndicator && 'pointer-events-auto',
            )}
            onClick={handleSeek}
          >
            <IconPlayerPlayFilled size={12} className="text-white" />
          </button>
        </div>
      </div>
    )
  },
)
