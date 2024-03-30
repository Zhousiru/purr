import { useCurrentEditingTaskValue } from '@/atoms/editor'
import { WaveformCanvas } from '@/components/layout/waveform-canvas'
import { player } from '@/lib/player'
import { formatSec } from '@/lib/utils/time'
import { useEffect } from 'react'

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
          <div className="absolute inset-0 flex flex-col gap-4 overflow-y-auto p-4">
            {task.result?.transcript.map((d) => (
              <div
                key={`${d.start}${d.end}${d.text}`}
                className="rounded-lg bg-gray-100 p-4 text-lg"
              >
                <div className="font-mono text-sm opacity-50">
                  {formatSec(d.start)} – {formatSec(d.end)}
                </div>
                {d.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
