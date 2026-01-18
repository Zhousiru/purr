'use client'

import {
  isReadyAtom,
  isRunningAtom,
  terminalLinesAtom,
} from '@/atoms/whisper-server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'

function Line({
  secondary,
  children,
}: {
  secondary: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded px-2 last:mb-1 hover:bg-white/10',
        secondary && 'italic text-white/50',
      )}
    >
      {children}
    </div>
  )
}

export function WhisperServerTerminal() {
  const lines = useAtomValue(terminalLinesAtom)
  const isRunning = useAtomValue(isRunningAtom)
  const isReady = useAtomValue(isReadyAtom)

  return (
    <div className="relative grow">
      <div className="absolute inset-0 overflow-y-auto whitespace-pre-wrap wrap-break-word bg-gray-600 px-2 py-4 font-mono text-white selection:bg-black/75!">
        <div>
          {lines.map((line, index) => (
            <Line
              key={`${index}${line.type}${line.data}`}
              secondary={['launch', 'exit'].includes(line.type)}
            >
              {['stdout', 'stderr'].includes(line.type) && line.data}
              {line.type === 'launch' && 'Whisper Server launched.'}
              {line.type === 'exit' && 'Whisper Server exited.'}
            </Line>
          ))}

          {lines.length === 0 && (
            <Line secondary>Launch to view the output.</Line>
          )}
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
