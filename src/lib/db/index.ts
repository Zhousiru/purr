import { Task } from '@/types/tasks'
import Dexie, { Table } from 'dexie'
import { isServer } from '../utils/is-server'

class Database extends Dexie {
  tasks!: Table<Task, string>

  constructor() {
    super('db')
    this.version(2).stores({
      tasks: 'id, type, group, status, creationTimestamp',
    })
  }
}

/**
 * NOTE: Check `isServer()` before using.
 */
export const db = isServer() ? null : new Database()
