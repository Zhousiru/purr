import { Task, TaskStatus } from '@/types/tasks'
import {
  TaskAtom,
  TaskListAtom,
  createTaskAtomWithDb,
} from '../db/task-atom-storage'
import { store } from '../store'

export type TaskProcessor<T extends Task> = (taskAtom: TaskAtom<T>) => {
  abort: () => void
  promise: Promise<void>
}

export interface TaskExecution<T extends Task> {
  taskAtom: TaskAtom<T>
  processor: ReturnType<TaskProcessor<T>>
}

export type TaskSlot<T extends Task> = TaskExecution<T> | null

export class TaskPool<T extends Task> {
  private taskListAtom: TaskListAtom<T>
  private taskProcessor: TaskProcessor<T>
  private taskSlots: Array<TaskSlot<T>>

  constructor(
    taskListAtom: TaskListAtom<T>,
    processor: TaskProcessor<T>,
    maxConcurrency: number,
  ) {
    this.taskListAtom = taskListAtom
    this.taskProcessor = processor
    this.taskSlots = new Array(maxConcurrency).fill(null)
  }

  private tryAssignTask(slotIndex: number): boolean {
    if (this.taskSlots[slotIndex]) {
      return false
    }

    const queued = this.getTaskAtoms('queued')

    if (queued.length === 0) {
      return false
    }

    const taskAtom = queued[0]
    this.updateTaskStatus(taskAtom, 'processing')

    const processor = this.taskProcessor(taskAtom)

    processor.promise
      .then(() => {
        this.updateTaskStatus(taskAtom, 'done')
      })
      .catch(() => {
        this.updateTaskStatus(taskAtom, 'stopped')
      })
      .finally(() => {
        this.taskSlots[slotIndex] = null
        this.tryAssignTask(slotIndex)
      })

    this.taskSlots[slotIndex] = {
      taskAtom,
      processor,
    }

    return true
  }

  private tryAssignTaskToAll() {
    for (let index = 0; index < this.taskSlots.length; index++) {
      this.tryAssignTask(index)
    }
  }

  private getTaskAtoms(filterStatus?: TaskStatus) {
    const taskAtoms = store.get(this.taskListAtom)

    if (filterStatus) {
      return taskAtoms.filter((t) => store.get(t).status === filterStatus)
    }

    return taskAtoms
  }

  private updateTaskStatus(taskAtom: TaskAtom<T>, status: TaskStatus) {
    store.set(taskAtom, (prev) => ({ ...prev, status }))
  }

  public addTask(task: T) {
    store.set(this.taskListAtom, (prev) => [
      ...prev,
      createTaskAtomWithDb(task),
    ])
    this.tryAssignTaskToAll()
  }

  public stopTask(taskName: string) {
    let inSlot = false
    for (const slot of this.taskSlots) {
      if (!slot) {
        continue
      }

      if (store.get(slot.taskAtom).name === taskName) {
        inSlot = true
        slot.processor.abort()
        break
      }
    }

    if (!inSlot) {
      for (const taskAtom of this.getTaskAtoms('processing')) {
        if (store.get(taskAtom).name === taskName) {
          this.updateTaskStatus(taskAtom, 'stopped')
          break
        }
      }
    }
  }

  public startTask(taskName: string) {
    for (const taskAtom of this.getTaskAtoms('stopped')) {
      if (store.get(taskAtom).name === taskName) {
        this.updateTaskStatus(taskAtom, 'queued')
        this.tryAssignTaskToAll()
        break
      }
    }
  }
}
