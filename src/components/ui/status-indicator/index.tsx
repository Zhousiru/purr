import { cn } from '@/lib/utils/cn'
import { TaskStatus } from '@/types/tasks'
import { IconCheck } from '@tabler/icons-react'

const INDICATOR_SIZE = 16
const INDICATOR_STROKE = 2
const INDICATOR_RADIUS = (INDICATOR_SIZE - INDICATOR_STROKE) / 2
const INDICATOR_CIRCUMFERENCE = 2 * Math.PI * INDICATOR_RADIUS

export function StatusIndicator({
  status,
  progress = 0,
}: {
  status: TaskStatus
  progress?: number
}) {
  if (status === 'done') {
    return <IconCheck size={16} className="shrink-0 text-green-500" />
  }

  if (status === 'stopped') {
    return (
      <svg width={INDICATOR_SIZE} height={INDICATOR_SIZE} className="shrink-0">
        <circle
          cx={INDICATOR_SIZE / 2}
          cy={INDICATOR_SIZE / 2}
          r={INDICATOR_RADIUS}
          fill="none"
          strokeWidth={INDICATOR_STROKE}
          className="stroke-black/5"
        />
        <circle
          cx={INDICATOR_SIZE / 2}
          cy={INDICATOR_SIZE / 2}
          r={INDICATOR_RADIUS}
          fill="none"
          strokeWidth={INDICATOR_STROKE}
          className="stroke-gray-300"
          strokeDasharray={INDICATOR_CIRCUMFERENCE}
          strokeDashoffset={
            INDICATOR_CIRCUMFERENCE - (progress / 100) * INDICATOR_CIRCUMFERENCE
          }
          strokeLinecap="round"
          transform={`rotate(-90 ${INDICATOR_SIZE / 2} ${INDICATOR_SIZE / 2})`}
        />
      </svg>
    )
  }

  // processing or queued
  return (
    <svg
      width={INDICATOR_SIZE}
      height={INDICATOR_SIZE}
      className={cn('shrink-0', status === 'queued' && 'animate-pulse')}
    >
      {/* background track */}
      <circle
        cx={INDICATOR_SIZE / 2}
        cy={INDICATOR_SIZE / 2}
        r={INDICATOR_RADIUS}
        fill="none"
        strokeWidth={INDICATOR_STROKE}
        className="stroke-black/5"
      />
      {/* progress arc */}
      <circle
        cx={INDICATOR_SIZE / 2}
        cy={INDICATOR_SIZE / 2}
        r={INDICATOR_RADIUS}
        fill="none"
        strokeWidth={INDICATOR_STROKE}
        className="stroke-blue-400 transition-all"
        strokeDasharray={INDICATOR_CIRCUMFERENCE}
        strokeDashoffset={
          INDICATOR_CIRCUMFERENCE - (progress / 100) * INDICATOR_CIRCUMFERENCE
        }
        strokeLinecap="round"
        transform={`rotate(-90 ${INDICATOR_SIZE / 2} ${INDICATOR_SIZE / 2})`}
      />
    </svg>
  )
}
