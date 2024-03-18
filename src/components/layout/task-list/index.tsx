'use client'

import { taskListAtom } from '@/atoms/tasks'
import { Button } from '@/components/ui/button'
import { cmd } from '@/lib/commands'
import { addTask } from '@/lib/task-manager'
import { Monitor } from '@/lib/whisper-server/monitor'
import { TranscribeOptions, TranslateOptions } from '@/types/tasks'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'
import { TaskItem } from './TaskItem'

const monitor = new Monitor()

export function TaskList() {
  const tasks = useAtomValue(taskListAtom)

  const debugCounts = useRef(0)

  function handleDebugAddTranscribeTask() {
    debugCounts.current++
    addTask(
      'transcribe',
      { name: 'Task ' + debugCounts.current, group: 'Group 1' },
      {} as TranscribeOptions,
    )
  }

  function handleDebugAddTranslateTask() {
    debugCounts.current++
    addTask(
      'translate',
      { name: 'Task ' + debugCounts.current, group: 'Group 1' },
      {} as TranslateOptions,
    )
  }

  async function handleDebugCallGetLoudness() {
    console.log(
      await cmd.getAudioWaveformData({
        path: 'C:\\Users\\Syrhu\\Desktop\\test.wav',
        pairPerSec: 75,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* FIXME: Debug buttons. */}
      <div className="fixed bottom-4 right-4 z-40 flex gap-1">
        <Button onClick={handleDebugAddTranslateTask}>Add translate</Button>
        <Button onClick={handleDebugAddTranscribeTask}>Add transcribe</Button>
        <Button onClick={handleDebugCallGetLoudness}>Get loudness</Button>
      </div>

      {tasks.map((t) => (
        <TaskItem key={`${t}`} taskAtom={t} />
      ))}

      <div className="flex h-8 items-center justify-center text-sm font-light text-gray-400">
        {tasks.length === 0
          ? 'No matched tasks'
          : `${tasks.length} matched task(s)`}
      </div>
    </div>
  )
}
