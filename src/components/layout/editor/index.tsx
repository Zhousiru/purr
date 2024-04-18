import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { WaveformCanvas } from '@/components/layout/editor/waveform-canvas'
import { player } from '@/lib/player'
import { useEffect } from 'react'
import { FloatController } from './float-controller'
import { TimelineContent } from './timeline-content'

export function Editor() {
  const task = useCurrentEditingTaskValue()

  if (task.type === 'translate') {
    // TODO: Translation task.
    throw new Error('Not implemented.')
  }

  useEffect(() => {
    if (player.currentSource !== task.options.sourcePath) {
      player.load(task.options.sourcePath)
    }

    return () => {
      player.pause()
    }
  }, [task.options.sourcePath])

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
      <div className="relative flex flex-grow">
        <div className="flex w-[350px] border-r bg-gray-50">
          <div className="relative flex-grow">
            <WaveformCanvas
              path={task.options.sourcePath}
              mergeChannels={false}
            />
          </div>
        </div>

        <div className="relative flex-grow">
          <TimelineContent />
          <FloatController />
        </div>
      </div>
    </>
  )
}
