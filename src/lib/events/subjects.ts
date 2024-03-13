import { DaemonEventPayload } from '@/types/events'
import { Subject } from 'rxjs'

export const daemonSubject = new Subject<DaemonEventPayload>()
