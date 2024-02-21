'use client'

import {
  isReadyAtom,
  isRunningAtom,
  terminalLinesAtom,
} from '@/atoms/whisper-server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { useAtomValue } from 'jotai'

export function WhisperServerTerminal() {
  const lines = useAtomValue(terminalLinesAtom)
  const isRunning = useAtomValue(isRunningAtom)
  const isReady = useAtomValue(isReadyAtom)

  return (
    <div className="relative flex-grow">
      <div className="absolute inset-0 overflow-y-auto whitespace-pre-wrap bg-gray-600 px-2 py-4 font-mono text-white selection:!bg-black/75">
        <div>
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                'rounded px-2 last:mb-1 hover:bg-white/10',
                ['launch', 'exit'].includes(line.type) &&
                  'italic text-white/50',
              )}
            >
              {['stdout', 'stderr'].includes(line.type) && line.data}
              {line.type === 'launch' && 'Whisper Server launched.'}
              {line.type === 'exit' && 'Whisper Server exited.'}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 px-2">
          <Badge
            className={cn(
              'inline-flex border-black font-bold text-black/75',
              isRunning && !isReady && 'bg-blue-200',
              isReady && 'bg-green-200',
            )}
          >
            {!isRunning && 'STOPPED'}
            {isRunning && !isReady && 'LOADING'}
            {isReady && 'READY'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
