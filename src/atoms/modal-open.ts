import { store } from '@/lib/store'
import { atom, useAtomValue } from 'jotai'
import { useEffect } from 'react'

const modalOpenCountAtom = atom(0)

export const getIsAnyModalOpen = () => store.get(modalOpenCountAtom) > 0
export const useIsAnyModalOpenValue = () =>
  useAtomValue(modalOpenCountAtom) > 0

export function useRegisterModalOpen(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return
    store.set(modalOpenCountAtom, (c) => c + 1)
    return () => store.set(modalOpenCountAtom, (c) => c - 1)
  }, [isOpen])
}
