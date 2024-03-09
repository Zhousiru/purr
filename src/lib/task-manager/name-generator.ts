import { Task } from '@/types/tasks'
import { TaskAtom, TaskListAtom } from '../db/task-atom-storage'
import { store } from '../store'
import { getFilename } from '../utils/path'

export class NameGenerator<T extends Task> {
  private existed = new Map<string, number>()
  private currentTaskList: Array<TaskAtom<T>> = []
  private taskListAtom: TaskListAtom<T>
  private unsub: () => void

  constructor(taskListAtom: TaskListAtom<T>) {
    this.taskListAtom = taskListAtom
    this.retrieveExisted()
    this.unsub = store.sub(taskListAtom, this.retrieveExisted.bind(this))
  }

  public generateName(path: string) {
    const filename = getFilename(path)
    const count = this.existed.get(filename) ?? 0
    return count === 0 ? filename : `${filename} (${count})`
  }

  public dispose() {
    this.unsub()
  }

  private retrieveExisted() {
    const prevTaskList = this.currentTaskList
    this.currentTaskList = store.get(this.taskListAtom)

    const deleted = prevTaskList.filter(
      (atom) => !this.currentTaskList.includes(atom),
    )
    const added = this.currentTaskList.filter(
      (atom) => !prevTaskList.includes(atom),
    )

    for (const atom of deleted) {
      const task = store.get(atom)
      const originalName = this.getOriginalName(task.name)
      this.existed.set(originalName, this.existed.get(originalName)! - 1)
    }
    for (const atom of added) {
      const task = store.get(atom)
      const originalName = this.getOriginalName(task.name)
      this.existed.set(originalName, (this.existed.get(originalName) ?? 0) + 1)
    }
  }

  private getOriginalName(taskName: string) {
    return taskName.replace(/ \(\d*\)$/, '')
  }
}
