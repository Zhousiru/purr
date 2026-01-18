import {
  useCurrentEditingAudioDurationValue,
  useCurrentEditingAudioPathValue,
} from '@/atoms/editor'
import { WaveformCanvas } from '@/components/layout/editor/waveform-canvas'
import { player } from '@/lib/player'
import { useEffect } from 'react'
import { FloatController } from './float-controller'
import { FollowModeDispatcher } from './follow-mode-dispatcher'
import { TimelineContent } from './timeline-content'

export function Editor() {
  const audioPath = useCurrentEditingAudioPathValue()
  const audioDuration = useCurrentEditingAudioDurationValue()

  useEffect(() => {
    if (player.currentSource !== audioPath) {
      player.load(audioPath)
    }

    return () => {
      player.pause()
    }
  }, [audioPath])

  // Toggle playing by `Space`.
  useEffect(() => {
    const handleTogglePlay = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        player.togglePlay()
      }
    }

    document.addEventListener('keydown', handleTogglePlay)

    return () => document.removeEventListener('keydown', handleTogglePlay)
  }, [])

  // TODO: Improve the display of transcripts.

  return (
    <>
      <div className="relative flex grow">
        <div className="flex w-[350px] border-r border-gray-200 bg-gray-50">
          <div className="relative grow">
            <WaveformCanvas
              path={audioPath}
              duration={audioDuration}
              mergeChannels={false}
            />
          </div>
        </div>

        <div className="relative grow">
          <TimelineContent />
          <FloatController />
        </div>
      </div>

      <FollowModeDispatcher />
    </>
  )
}
