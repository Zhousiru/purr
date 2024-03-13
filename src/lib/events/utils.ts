import { Subject } from 'rxjs'
import { daemonSubject } from './subjects'

export function waitUntilNextEvent<T>(
  subject: Subject<T>,
  compare?: (payload: T) => boolean,
) {
  return new Promise<void>((resolve) => {
    const sub = subject.subscribe((payload) => {
      if (!compare || compare(payload)) {
        sub.unsubscribe()
        resolve()
      }
    })
  })
}

export function waitUntilExit() {
  return waitUntilNextEvent(daemonSubject, (payload) => payload.type === 'exit')
}
