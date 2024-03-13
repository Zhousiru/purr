import { MonitorEvent } from '@/types/whisper-server'
import { Subject, filter } from 'rxjs'

export interface MonitorCallbacks {
  onConnected: () => void
  onDisconnected: () => void
}

export class Monitor {
  eventSource: EventSource | null = null
  eventSubject: Subject<MonitorEvent> | null = null
  callbacks?: MonitorCallbacks

  public bindCallbacks(callbacks: MonitorCallbacks) {
    this.callbacks = callbacks
  }

  public connect(baseUrl: string) {
    if (
      this.eventSource?.readyState === EventSource.OPEN ||
      this.eventSource?.readyState === EventSource.CONNECTING
    ) {
      throw new Error('Already connected to the whisper server.')
    }

    const url = new URL('monitor', baseUrl)
    this.eventSource = new EventSource(url.toString())

    this.eventSource.onmessage = this.onMessage
    this.eventSource.onopen = this.onOpen
    this.eventSource.onerror = this.onError
  }

  public close() {
    if (
      !this.eventSource ||
      this.eventSource.readyState === EventSource.CLOSED
    ) {
      return
    }

    this.eventSource?.close()
    this.eventSubject?.error('Whisper server connection closed.')
    this.callbacks?.onDisconnected()
  }

  public reconnect(baseUrl: string) {
    this.close()
    this.connect(baseUrl)
  }

  private onMessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as MonitorEvent
    this.eventSubject!.next(data)
  }

  private onOpen = () => {
    this.eventSubject = new Subject()
    this.callbacks?.onConnected()
  }

  private onError = () => {
    this.eventSubject!.error('Whisper server connection error.')
    this.callbacks?.onDisconnected()
  }

  public async *watch(taskName: string) {
    const observable = this.eventSubject!.pipe(
      filter((event) => event.taskName === taskName),
    )

    let resolveNext: (value: MonitorEvent) => void
    let rejectNext: (value: MonitorEvent) => void

    const sub = observable.subscribe({
      next: (event) => {
        resolveNext(event)
      },
      error: (error) => {
        rejectNext(error)
      },
      complete: () => {
        // Never complete.
        // We'll handle completion in the task processor by checking the `status` event.
      },
    })

    try {
      for (;;) {
        const event = await new Promise<MonitorEvent>((resolve, reject) => {
          resolveNext = resolve
          rejectNext = reject
        })
        yield event
      }
    } finally {
      sub.unsubscribe()
    }
  }
}
