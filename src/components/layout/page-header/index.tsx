import { ReactNode } from 'react'

export function PageHeader({ children }: { children: ReactNode }) {
  return (
    <div className="z-20 flex h-14 items-center px-4 text-xl shadow">
      {children}
    </div>
  )
}
