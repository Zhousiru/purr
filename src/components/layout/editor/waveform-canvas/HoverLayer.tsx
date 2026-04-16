import {
  getCurrentEditingAudioDuration,
  getDataMap,
  setCurrentEditingTask,
  useAddMarkContext,
} from '@/atoms/editor'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { MIN_DURATION } from '@/constants/editor'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { IconCheck, IconPlayerPlay, IconPlus, IconX } from '@tabler/icons-react'
import { produce } from 'immer'
import {
  Dispatch,
  MouseEvent,
  MouseEventHandler,
  Ref,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { seekHeight, seekTime } from './utils'

export interface HoverLayerRef {
  updateBounding: (rect: DOMRect) => void
  updateMouse: (x: number, y: number) => void
  updateOffset: (y: number) => void
  setIsHover: Dispatch<SetStateAction<boolean>>
}

type HoverLayerProps = {
  ref?: Ref<HoverLayerRef>
}

/** Clamp a content-space height so `seekTime` stays within [0, duration]. */
function clampHeight(h: number): number {
  const minH = seekHeight(0)
  const maxH = seekHeight(getCurrentEditingAudioDuration())
  return Math.max(minH, Math.min(maxH, h))
}

/** Check whether the current hover position is a legal place for a boundary. */
function isPositionLegal(
  contentHeight: number,
  addMarkCtx: { startHeight: number } | null,
): boolean {
  const data = Array.from(getDataMap().values())

  const time = seekTime(clampHeight(contentHeight))

  if (!addMarkCtx) {
    // First boundary: must not land inside any existing subtitle.
    return !data.some((d) => time > d.start && time < d.end)
  }

  // Second boundary: region must be contiguous and large enough.
  const startTime = seekTime(clampHeight(addMarkCtx.startHeight))
  const [minTime, maxTime] =
    startTime < time ? [startTime, time] : [time, startTime]

  if (maxTime - minTime < MIN_DURATION) return false

  // No existing subtitle should overlap the new region.
  return !data.some((d) => d.start < maxTime && d.end > minTime)
}

export const HoverLayer = ({ ref }: HoverLayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const offsetRef = useRef(0)
  const visualHeightRef = useRef(0)

  const [showIndicator, setShowIndicator] = useState(false)

  const [addMarkContext, setAddMarkContext] = useAddMarkContext()

  // Keep a ref in sync so imperative callbacks see the latest value.
  const addMarkContextRef = useRef(addMarkContext)
  addMarkContextRef.current = addMarkContext

  function updateLegality() {
    const contentHeight = visualHeightRef.current + offsetRef.current
    const legal = isPositionLegal(contentHeight, addMarkContextRef.current)
    if (addButtonRef.current) {
      addButtonRef.current.style.display = legal ? '' : 'none'
    }
  }

  // Re-check legality when addMarkContext changes (first boundary placed/cleared).
  useEffect(updateLegality, [addMarkContext])

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
        visualHeightRef.current = height
        updateLegality()
      },
      updateOffset(y) {
        offsetRef.current = y
        updateLegality()
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
    void player.play().catch(() => {})
  }

  // Handle adding mark.
  const handleAddMark: MouseEventHandler<HTMLButtonElement> = (e) => {
    const contentHeight = clampHeight(calcHeight(e))

    if (!addMarkContext) {
      // First click: place the start boundary.
      setAddMarkContext({ startHeight: contentHeight })
      return
    }

    // Second click: create the new subtitle.
    const startTime = seekTime(clampHeight(addMarkContext.startHeight))
    const endTime = seekTime(contentHeight)
    const [minTime, maxTime] =
      startTime < endTime ? [startTime, endTime] : [endTime, startTime]

    setCurrentEditingTask((prev) =>
      produce(prev, (draft) => {
        if (!draft.result) return
        if (draft.type === 'transcribe') {
          draft.result.data.push({
            id: crypto.randomUUID(),
            start: minTime,
            end: maxTime,
            text: 'New subtitle...',
          })
        } else {
          draft.result.data.push({
            id: crypto.randomUUID(),
            start: minTime,
            end: maxTime,
            text: 'New subtitle...',
            translated: '',
          })
        }
        draft.result.data.sort((a, b) => a.start - b.start)
      }),
    )

    setAddMarkContext(null)
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
            'border-foreground border-t border-dashed',
            addMarkContext && 'border-accent',
          )}
        />

        <div
          className={cn(
            'bg-foreground absolute right-3 flex h-5 -translate-y-1/2 overflow-hidden rounded border border-transparent shadow-md',
            showIndicator && 'pointer-events-auto',
            addMarkContext && 'bg-accent',
          )}
        >
          <TooltipGroup>
            {addMarkContext && (
              <Tooltip content="Cancel" placement="top">
                <button
                  className="flex items-center justify-center px-1"
                  onClick={() => setAddMarkContext(null)}
                  tabIndex={showIndicator ? 0 : -1}
                >
                  <IconX size={12} className="text-accent-foreground" />
                </button>
              </Tooltip>
            )}

            <Tooltip content="Add" placement="top">
              <button
                ref={addButtonRef}
                className={cn(
                  'flex items-center justify-center px-1',
                  !addMarkContext && 'bg-card',
                )}
                onClick={handleAddMark}
                tabIndex={showIndicator ? 0 : -1}
              >
                {addMarkContext ? (
                  <IconCheck size={12} className="text-accent-foreground" />
                ) : (
                  <IconPlus size={12} className="text-muted-foreground" />
                )}
              </button>
            </Tooltip>

            <Tooltip content="Play" placement="top">
              <button
                className={cn(
                  'flex items-center justify-center px-1',
                  addMarkContext && 'bg-card',
                )}
                onClick={handleSeek}
                // Prevent focus when not show.
                tabIndex={showIndicator ? 0 : -1}
              >
                <IconPlayerPlay
                  size={12}
                  className={cn(!addMarkContext && 'text-primary-foreground')}
                />
              </button>
            </Tooltip>
          </TooltipGroup>
        </div>
      </div>
    </div>
  )
}
