import { useCurrentEditingAudioDurationValue } from '@/atoms/editor'
import { player } from '@/lib/player'
import { formatSec } from '@/lib/utils/time'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import { MouseEventHandler, useEffect, useRef, useState } from 'react'

export function FloatController() {
  const totalDuration = useCurrentEditingAudioDurationValue()
  const [currentTime, setCurrentTime] = useState(0)
  const remainDuration = totalDuration - currentTime
  const formatedTotalDuration = formatSec(totalDuration, false)
  const formatedCurrent = formatSec(currentTime, false)
  const formatedRemainDuration = '-' + formatSec(remainDuration, false)

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
    nowSeeking.current = calcSeekingProgress(e.clientX)
    setCurrentTime(totalDuration * nowSeeking.current)
    updateBarProgress(nowSeeking.current)
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
      <div className="pointer-events-auto rounded-lg border bg-gray-900/50 shadow-lg backdrop-blur backdrop-saturate-150">
        <div
          className="group mx-2 mt-2 flex h-4 cursor-pointer items-center px-2"
          onMouseDown={handleSeekMouseDown}
        >
          <div className="relative">
            <div
              className="relative h-0.5 w-[350px] overflow-hidden rounded-full bg-white/25 group-hover:h-1"
              ref={barRef}
            >
              <div
                ref={barInnerRef}
                className="pointer-events-none absolute inset-y-0 left-0 bg-white"
              />
            </div>
            <div
              ref={knobRef}
              className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow group-hover:h-3 group-hover:w-3"
            />
          </div>
        </div>

        <div className="px-4">
          <div className="flex justify-between text-xs text-white/75">
            <div>{formatedCurrent}</div>
            <div
              className="w-14 text-right"
              onMouseEnter={() => setShowTotalDuration(true)}
              onMouseLeave={() => setShowTotalDuration(false)}
            >
              {showTotalDuration
                ? formatedTotalDuration
                : formatedRemainDuration}
            </div>
          </div>
        </div>

        <IconPlayerPlayFilled className="text-white" />
      </div>
    </div>
  )
}
