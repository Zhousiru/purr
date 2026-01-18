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
import { Button } from './Button'

export function FloatController() {
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

  // Update playback progress.
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

  // Handle seek.
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
      console.log('FloatController.Seek', nowSeeking.current)
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
    <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
      <div className="pointer-events-auto rounded-lg border border-white/25 bg-gray-900/50 p-2 shadow-lg backdrop-blur backdrop-saturate-150">
        <div
          className="group flex h-4 cursor-pointer items-center px-2"
          onMouseDown={handleSeekMouseDown}
        >
          <div className="relative">
            <div
              className="relative h-0.5 w-[350px] overflow-hidden rounded-full bg-white/25 transition-[height] duration-75 group-hover:h-1"
              ref={barRef}
            >
              <div
                ref={barInnerRef}
                className="pointer-events-none absolute inset-y-0 left-0 bg-white"
              />
            </div>
            <div
              ref={knobRef}
              className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow transition-transform duration-75 group-hover:scale-125"
            />
          </div>
        </div>

        <div className="px-2">
          <div className="flex justify-between text-xs text-white/75">
            <div>{formattedCurrent}</div>
            <div
              className="w-14 text-right"
              onMouseEnter={() => setShowTotalDuration(true)}
              onMouseLeave={() => setShowTotalDuration(false)}
            >
              {showTotalDuration
                ? formattedTotalDuration
                : formattedRemainDuration}
            </div>
          </div>
        </div>

        <div className="relative flex h-10 items-center gap-1 px-1">
          <TooltipGroup>
            <div className="pointer-events-none absolute inset-0 flex justify-center [&>*]:pointer-events-auto">
              <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
                <Button
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
              <Button
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
              <Button
                className="ml-auto"
                onClick={() => alert('Export')}
                icon={<IconShare2 size={16} />}
                small
              />
            </Tooltip>
            <Tooltip content="Translate">
              <Button
                onClick={() => alert('Translate')}
                icon={<IconLanguage size={16} />}
                small
              />
            </Tooltip>
          </TooltipGroup>
        </div>
      </div>
    </div>
  )
}
