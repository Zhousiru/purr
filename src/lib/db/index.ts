import { Task } from '@/types/tasks'
import Dexie, { Table } from 'dexie'
import { isServer } from '../utils/is-server'

class Database extends Dexie {
  tasks!: Table<Task, [string, string]>

  constructor() {
    super('db')
    this.version(1).stores({
      tasks: '[type+name], group, status, options, result',
    })
  }
}

/**
 * NOTE: Check `isServer()` before using.
 */
export const db = isServer() ? null : new Database()
