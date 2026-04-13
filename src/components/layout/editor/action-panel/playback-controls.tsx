import {
  useCurrentEditingAudioDurationValue,
  useIsFollowMode,
  useIsPlayingValue,
} from '@/atoms/editor'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { player } from '@/lib/player'
import { cn } from '@/lib/utils/cn'
import { formatSec } from '@/lib/utils/time'
import {
  IconLanguage,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconShare2,
  IconViewfinder,
} from '@tabler/icons-react'
import { MouseEventHandler, useEffect, useRef, useState } from 'react'
import { ControlButton } from './control-button'

export function PlaybackControls() {
  const isPlaying = useIsPlayingValue()
  const [isFollowMode, setIsFollowMode] = useIsFollowMode()

  const totalDuration = useCurrentEditingAudioDurationValue()
  const [currentTime, setCurrentTime] = useState(0)
  const remainDuration = totalDuration - currentTime
  const formattedTotalDuration = formatSec(totalDuration, false)
  const formattedCurrent = formatSec(currentTime, false)
  const formattedRemainDuration = '-' + formatSec(remainDuration, false)

  const [showTotalDuration, setShowTotalDuration] = useState(false)

  const barRef = useRef<HTMLDivElement>(null)
  const barInnerRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)

  const nowSeeking = useRef<number | null>(null)

  function updateBarProgress(progress: number) {
    barInnerRef.current!.style.width = progress * 100 + '%'
    knobRef.current!.style.right = 100 - progress * 100 + '%'
  }
  useEffect(() => {
    const unsub = player.subCurrentTime((time) => {
      if (nowSeeking.current === null) {
        setCurrentTime(Math.round(time))
        updateBarProgress(time / totalDuration)
      }
    })
    return () => unsub()
  }, [totalDuration])

  function calcSeekingProgress(clientX: number) {
    let left = clientX - barRef.current!.getBoundingClientRect().left
    if (left < 0) {
      left = 0
    }
    if (left > barRef.current!.offsetWidth) {
      left = barRef.current!.offsetWidth
    }

    return left / barRef.current!.offsetWidth
  }

  useEffect(() => {
    const seekMouseMove = (e: MouseEvent) => {
      if (nowSeeking.current === null) return
      nowSeeking.current = calcSeekingProgress(e.clientX)
      setCurrentTime(totalDuration * nowSeeking.current)
      updateBarProgress(nowSeeking.current!)
    }

    const seekMouseUp = () => {
      if (nowSeeking.current === null) return
      player.seek(totalDuration * nowSeeking.current)
      nowSeeking.current = null
    }

    document.addEventListener('mousemove', seekMouseMove)
    document.addEventListener('mouseup', seekMouseUp)

    return () => {
      document.removeEventListener('mousemove', seekMouseMove)
      document.removeEventListener('mouseup', seekMouseUp)
    }
  }, [totalDuration])

  const handleSeekMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) {
      return
    }

    nowSeeking.current = calcSeekingProgress(e.clientX)
    setCurrentTime(totalDuration * nowSeeking.current)
    updateBarProgress(nowSeeking.current)
  }

  return (
    <div className="border-border bg-card border-t p-3">
      <div
        className="group flex h-4 cursor-pointer items-center"
        onMouseDown={handleSeekMouseDown}
      >
        <div className="relative w-full">
          <div
            className="bg-muted relative h-0.5 w-full overflow-hidden rounded-full transition-[height] duration-75 group-hover:h-1"
            ref={barRef}
          >
            <div
              ref={barInnerRef}
              className="bg-foreground pointer-events-none absolute inset-y-0 left-0"
            />
          </div>
          <div
            ref={knobRef}
            className="bg-foreground pointer-events-none absolute top-1/2 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-transform duration-75 group-hover:scale-125"
          />
        </div>
      </div>

      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <div>{formattedCurrent}</div>
        <div
          className="w-14 text-right"
          onMouseEnter={() => setShowTotalDuration(true)}
          onMouseLeave={() => setShowTotalDuration(false)}
        >
          {showTotalDuration ? formattedTotalDuration : formattedRemainDuration}
        </div>
      </div>

      <div className="relative mt-1 flex h-10 items-center gap-1">
        <TooltipGroup>
          <div className="pointer-events-none absolute inset-0 flex justify-center [&>*]:pointer-events-auto">
            <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
              <ControlButton
                onClick={() => player.togglePlay()}
                icon={
                  isPlaying ? (
                    <IconPlayerPauseFilled />
                  ) : (
                    <IconPlayerPlayFilled />
                  )
                }
              />
            </Tooltip>
          </div>
          <Tooltip content="Follow mode">
            <ControlButton
              onClick={() => setIsFollowMode((prev) => !prev)}
              icon={
                <IconViewfinder
                  className={cn('transition', !isFollowMode && 'opacity-50')}
                  size={16}
                />
              }
              small
            />
          </Tooltip>
          <Tooltip content="Export">
            <ControlButton
              className="ml-auto"
              onClick={() => alert('Export')}
              icon={<IconShare2 size={16} />}
              small
            />
          </Tooltip>
          <Tooltip content="Translate">
            <ControlButton
              onClick={() => alert('Translate')}
              icon={<IconLanguage size={16} />}
              small
            />
          </Tooltip>
        </TooltipGroup>
      </div>
    </div>
  )
}
