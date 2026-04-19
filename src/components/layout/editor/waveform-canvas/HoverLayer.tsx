import {
  getAddMarkContext,
  getCurrentEditingAudioDuration,
  getDataMap,
  setCurrentEditingTask,
  useAddMarkContext,
  useWaveformColumnWidthValue,
} from '@/atoms/editor'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { MIN_DURATION } from '@/constants/editor'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { Translation } from '@/types/tasks'
import { IconCheck, IconPlayerPlay, IconPlus, IconX } from '@tabler/icons-react'
import { produce } from 'immer'
import {
  Dispatch,
  MouseEvent,
  MouseEventHandler,
  Ref,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { clientYToContentY, seekHeight, seekTime } from './utils'

export interface HoverLayerRef {
  updateMouse: (x: number, y: number) => void
  setIsHover: Dispatch<SetStateAction<boolean>>
}

type HoverLayerProps = {
  ref?: Ref<HoverLayerRef>
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

function clampHeight(h: number): number {
  const minH = seekHeight(0)
  const maxH = seekHeight(getCurrentEditingAudioDuration())
  return Math.max(minH, Math.min(maxH, h))
}

function isPositionLegal(
  contentHeight: number,
  addMarkCtx: { startHeight: number } | null,
): boolean {
  const data = Array.from(getDataMap().values())
  const time = seekTime(clampHeight(contentHeight))

  if (!addMarkCtx) {
    return !data.some((d) => time > d.start && time < d.end)
  }

  const startTime = seekTime(addMarkCtx.startHeight)
  const [minTime, maxTime] =
    startTime < time ? [startTime, time] : [time, startTime]

  if (maxTime - minTime < MIN_DURATION) return false

  return !data.some((d) => d.start < maxTime && d.end > minTime)
}

export const HoverLayer = ({ ref, scrollContainerRef }: HoverLayerProps) => {
  const indicatorRef = useRef<HTMLDivElement>(null)

  const [showIndicator, setShowIndicator] = useState(false)
  const [isLegalMark, setIsLegalMark] = useState(true)

  const [addMarkContext, setAddMarkContext] = useAddMarkContext()
  const waveformWidth = useWaveformColumnWidthValue()

  const syncLegality = useCallback(() => {
    const scrollEl = scrollContainerRef.current
    const indicator = indicatorRef.current
    if (!scrollEl || !indicator) return
    const stickyY = parseFloat(indicator.style.top) || 0
    const contentY = stickyY + scrollEl.scrollTop
    setIsLegalMark(isPositionLegal(contentY, getAddMarkContext()))
  }, [scrollContainerRef])

  useEffect(syncLegality, [syncLegality])

  useEffect(() => {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return
    scrollEl.addEventListener('scroll', syncLegality, { passive: true })
    return () => scrollEl.removeEventListener('scroll', syncLegality)
  }, [scrollContainerRef, syncLegality])

  useImperativeHandle(
    ref,
    () => ({
      updateMouse(_, y) {
        const scrollEl = scrollContainerRef.current
        const indicator = indicatorRef.current
        if (!scrollEl || !indicator) return
        indicator.style.top = y - scrollEl.getBoundingClientRect().top + 'px'
        syncLegality()
      },
      setIsHover: setShowIndicator,
    }),
    [scrollContainerRef, syncLegality],
  )

  function calcContentY(e: MouseEvent): number {
    const scrollEl = scrollContainerRef.current
    if (!scrollEl) return 0
    return clientYToContentY(e.clientY, scrollEl)
  }

  const handleSeek: MouseEventHandler<HTMLButtonElement> = (e) => {
    player.seek(seekTime(calcContentY(e)))
    void player.play().catch(() => {})
  }

  const handleAddMark: MouseEventHandler<HTMLButtonElement> = (e) => {
    const contentHeight = clampHeight(calcContentY(e))

    if (!addMarkContext) {
      setAddMarkContext({ startHeight: contentHeight })
      return
    }

    const startTime = seekTime(addMarkContext.startHeight)
    const endTime = seekTime(contentHeight)
    const [minTime, maxTime] =
      startTime < endTime ? [startTime, endTime] : [endTime, startTime]

    setCurrentEditingTask((prev) =>
      produce(prev, (draft) => {
        if (!draft.result) return
        const entry = {
          id: crypto.randomUUID(),
          start: minTime,
          end: maxTime,
          text: 'New subtitle...',
        }
        if (draft.type === 'transcribe') {
          draft.result.data.push(entry)
        } else {
          // Immer's draft union doesn't narrow `data` to Translation[],
          // so cast the inserted entry to satisfy the wider element type.
          draft.result.data.push({ ...entry, translated: '' } as Translation)
        }
        draft.result.data.sort((a, b) => a.start - b.start)
      }),
    )

    setAddMarkContext(null)
  }

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-30"
      style={{ width: waveformWidth }}
    >
      <div
        ref={indicatorRef}
        className={cn('sticky inset-x-0 h-0', !showIndicator && 'opacity-0')}
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
              <Tooltip key="cancel" content="Cancel" placement="top">
                <button
                  className="flex items-center justify-center px-1"
                  onClick={() => setAddMarkContext(null)}
                  tabIndex={showIndicator ? 0 : -1}
                >
                  <IconX size={12} className="text-accent-foreground" />
                </button>
              </Tooltip>
            )}

            {isLegalMark && (
              <Tooltip key="add" content="Add" placement="top">
                <button
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
            )}

            <Tooltip key="play" content="Play" placement="top">
              <button
                className={cn(
                  'flex items-center justify-center px-1',
                  addMarkContext && 'bg-card',
                )}
                onClick={handleSeek}
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
