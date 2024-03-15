import { useMonitorStatusValue } from '@/atoms/whisper-server'
import { Dot } from '@/components/ui/dot'
import { cn } from '@/lib/utils/cn'

export function WhisperConnectionIndicator({
  className,
}: {
  className?: string
}) {
  const status = useMonitorStatusValue()

  return (
    <Dot
      className={cn(
        'transition',
        status === 'connected' && 'bg-green-500',
        className,
      )}
    />
  )
}
