import { NewTasks } from '@/types/new-tasks-form'
import { Task } from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { store } from '../store'

export function isRecoveredTask<T extends Task>(taskAtom: PrimitiveAtom<T>) {
  return store.get(taskAtom).result !== null
}

export function initTaskResult<T extends Task>(
  taskAtom: PrimitiveAtom<T>,
  result: NonNullable<T['result']>,
) {
  store.set(taskAtom, (prev) => ({
    ...prev,
    result,
  }))
}

export function addTrans(formData: NewTasks) {
  if (formData.state.createTranscription) {
  }
}
