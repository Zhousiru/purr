import { Task } from '@/types/tasks'
import { PrimitiveAtom } from 'jotai'
import { createContext, useContext } from 'react'

const TaskAtomContext = createContext<PrimitiveAtom<Task> | null>(null)

export const TaskAtomProvider = TaskAtomContext.Provider

export const useTaskAtomContext = () => {
  const atom = useContext(TaskAtomContext)
  if (!atom) {
    throw new Error(
      '`useTaskAtomContext` must be used inside `TaskAtomProvider`',
    )
  }
  return atom
}
