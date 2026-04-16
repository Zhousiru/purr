import { useErrorTrigger } from '@/lib/debug/error-boundary-triggers'

export function ErrorTrigger({ scope }: { scope: 'inner' | 'outer' }) {
  useErrorTrigger(scope)
  return null
}
