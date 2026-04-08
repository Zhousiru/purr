import { Task } from '@/types/tasks'
import Dexie, { Table } from 'dexie'

class Database extends Dexie {
  tasks!: Table<Task, string>

  constructor() {
    super('db')
    this.version(2).stores({
      tasks: 'id, type, group, status, creationTimestamp',
    })
  }
}

export const db = new Database()
