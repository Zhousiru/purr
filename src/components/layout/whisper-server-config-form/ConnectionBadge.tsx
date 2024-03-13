import { monitorAtom } from '@/atoms/whisper-server'
import { Badge } from '@/components/ui/badge'
import { Dot } from '@/components/ui/dot'
import { cn } from '@/lib/utils/cn'
import { useAtomValue } from 'jotai'

export function ConnectionBadge() {
  const monitor = useAtomValue(monitorAtom)

  return (
    <Badge className="gap-1 border bg-transparent text-gray-600">
      <Dot
        className={cn(
          'transition',
          monitor.status === 'connected' && 'bg-green-500',
        )}
      />
      {monitor.status === 'connected' && 'Connected'}
      {monitor.status === 'disconnected' && 'Disconnected'}
    </Badge>
  )
}
