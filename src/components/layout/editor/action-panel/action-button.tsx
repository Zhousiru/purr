export function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm hover:bg-black/5">
      {children}
    </button>
  )
}
