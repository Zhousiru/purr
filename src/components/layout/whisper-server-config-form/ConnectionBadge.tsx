import { useMonitorStatusValue } from '@/atoms/whisper-server'
import { Badge } from '@/components/ui/badge'
import { Dot } from '@/components/ui/dot'
import { cn } from '@/lib/utils/cn'

export function ConnectionBadge() {
  const status = useMonitorStatusValue()

  return (
    <Badge className="gap-1 border border-gray-200 bg-transparent text-gray-600">
      <Dot
        className={cn('transition', status === 'connected' && 'bg-green-500')}
      />
      {status === 'connected' && 'Connected'}
      {status === 'disconnected' && 'Disconnected'}
    </Badge>
  )
}
