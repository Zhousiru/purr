import { useAddMarkContext } from '@/atoms/editor'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { IconCheck, IconPlayerPlay, IconPlus } from '@tabler/icons-react'
import {
  Dispatch,
  MouseEvent,
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

    const [addMarkContext, setAddMarkContext] = useAddMarkContext()

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

    function calcHeight(e: MouseEvent) {
      return (
        e.clientY -
        containerRef.current!.getBoundingClientRect().top +
        offsetRef.current
      )
    }

    const handleSeek: MouseEventHandler<HTMLButtonElement> = (e) => {
      player.seek(seekTime(calcHeight(e)))
      player.play()
    }

    // Handle adding mark.
    const handleAddMark: MouseEventHandler<HTMLButtonElement> = (e) => {
      if (!addMarkContext) {
        setAddMarkContext({
          startHeight: calcHeight(e),
        })

        return
      }

      setAddMarkContext(null)
      alert(
        `Start at: ${seekTime(addMarkContext.startHeight)}\nEnd at: ${seekTime(calcHeight(e))}`,
      )
    }

    return (
      <div
        ref={containerRef}
        className="pointer-events-none fixed z-50 overflow-hidden"
      >
        <div
          ref={indicatorRef}
          className={cn('absolute inset-x-0', !showIndicator && 'opacity-0')}
        >
          <div
            className={cn(
              'border-t border-dashed border-gray-900',
              addMarkContext && 'border-amber-500',
            )}
          />

          <div
            className={cn(
              'absolute right-2 flex h-5 -translate-y-1/2 overflow-hidden rounded border border-transparent bg-gray-900 shadow-md',
              showIndicator && 'pointer-events-auto',
              addMarkContext && 'bg-amber-500',
            )}
          >
            <TooltipGroup>
              <Tooltip content="Play" placement="top">
                <button
                  className={cn(
                    'flex items-center justify-center px-1',
                    addMarkContext && 'bg-white',
                  )}
                  onClick={handleSeek}
                >
                  <IconPlayerPlay
                    size={12}
                    className={cn(!addMarkContext && 'text-white')}
                  />
                </button>
              </Tooltip>

              <Tooltip content="Add" placement="top">
                <button
                  className={cn(
                    'flex items-center justify-center px-1',
                    !addMarkContext && 'bg-white',
                  )}
                  onClick={handleAddMark}
                >
                  {addMarkContext ? (
                    <IconCheck size={12} className="text-white" />
                  ) : (
                    <IconPlus size={12} className="text-gray-600" />
                  )}
                </button>
              </Tooltip>
            </TooltipGroup>
          </div>
        </div>
      </div>
    )
  },
)
