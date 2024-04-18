import { useCurrentAudioDurationValue } from '@/atoms/editor'
import { player } from '@/lib/player'
import { formatSec } from '@/lib/utils/time'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

export function FloatController() {
  const totalDuration = useCurrentAudioDurationValue()
  const [currentTime, setCurrentTime] = useState(0)
  const remainDuration = totalDuration - currentTime
  const formatedTotalDuration = formatSec(totalDuration, false)
  const formatedCurrent = formatSec(currentTime, false)
  const formatedRemainDuration = '-' + formatSec(remainDuration, false)

  const [showTotalDuration, setShowTotalDuration] = useState(false)

  const barInnerRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = player.subCurrentTime((time) => {
      setCurrentTime(Math.round(time))

      barInnerRef.current!.style.width = (time / totalDuration) * 100 + '%'
      knobRef.current!.style.right = 100 - (time / totalDuration) * 100 + '%'
    })
    return () => unsub()
  }, [totalDuration])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
      <div className="pointer-events-auto rounded-lg border bg-gray-900/50 shadow-lg backdrop-blur backdrop-saturate-150">
        <div className="group mx-2 mt-2 flex h-4 items-center px-2">
          <div className="relative">
            <div className="relative h-0.5 w-[350px] overflow-hidden rounded-full bg-white/25 transition-all duration-100 group-hover:h-1">
              <div
                ref={barInnerRef}
                className="absolute inset-y-0 left-0 bg-white transition-all duration-100"
              />
            </div>
            <div
              ref={knobRef}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow transition-all duration-100 group-hover:h-3 group-hover:w-3"
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
