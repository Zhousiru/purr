import { TranscribeTask } from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { store } from '../store'
import { TaskProcessor } from './pool'

export const transcribeProcessor: TaskProcessor<TranscribeTask> = (
  taskAtom: PrimitiveAtom<TranscribeTask>,
) => {
  // FIXME: Fake processor.

  let abort: null | (() => void) = null

  const promise = new Promise<void>((resolve, reject) => {
    const intervalId = setInterval(() => {
      console.log('interval')

      store.set(taskAtom, (prev) => {
        console.log(prev.result?.progress)
        return {
          ...prev,
          result: {
            transcription: [],
            progress: (prev.result?.progress ?? 0) + 10,
          },
        }
      })

      if ((store.get(taskAtom).result?.progress ?? 0) === 100) {
        clearInterval(intervalId)
        console.log('Done')
        resolve()
      }
    }, 500)

    abort = () => {
      clearInterval(intervalId)
      console.log('Abort')
      reject()
      return
    }
  })

  return {
    abort: abort!,
    promise,
  }
}
