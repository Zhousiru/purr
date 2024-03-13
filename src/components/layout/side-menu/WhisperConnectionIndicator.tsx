import { monitorAtom } from '@/atoms/whisper-server'
import { Dot } from '@/components/ui/dot'
import { cn } from '@/lib/utils/cn'
import { useAtomValue } from 'jotai'

export function WhisperConnectionIndicator({
  className,
}: {
  className?: string
}) {
  const monitor = useAtomValue(monitorAtom)

  return (
    <Dot
      className={cn(
        'transition',
        monitor.status === 'connected' && 'bg-green-500',
        className,
      )}
    />
  )
}
