'use client'

import { terminalLinesAtom } from '@/atoms/whisper-server'
import { cn } from '@/lib/utils/cn'
import { useAtomValue } from 'jotai'

export function WhisperServerTerminal() {
  const lines = useAtomValue(terminalLinesAtom)

  return (
    <div className="relative flex-grow">
      <div className="absolute inset-0 overflow-y-auto whitespace-pre-wrap bg-gray-600 px-2 py-4 font-mono text-white">
        {lines.map((line, index) => (
          <div
            key={index}
            className={cn(
              'rounded px-2 hover:bg-white/10',
              ['launch', 'exit'].includes(line.type) && 'italic text-white/50',
            )}
          >
            {['stdout', 'stderr'].includes(line.type) && line.data}
            {line.type === 'launch' && 'Whisper Server launched.'}
            {line.type === 'exit' && 'Whisper Server exited.'}
          </div>
        ))}
      </div>
    </div>
  )
}
