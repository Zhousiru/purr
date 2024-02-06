import { IconX } from '@tabler/icons-react'

export function FileList({
  data,
  onChange,
}: {
  data: string[]
  onChange: (data: string[]) => void
}) {
  function handleRemove(path: string) {
    onChange(data.filter((f) => f !== path))
  }

  return (
    <div className="h-[300px] overflow-y-auto rounded-md border bg-gray-50">
      <div>
        {data.map((p) => (
          <div
            key={p}
            className="flex items-center gap-2 border-b bg-white p-2 last:shadow-sm"
          >
            <div className="max-w-full flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {p.substring(p.lastIndexOf('/') + 1)}
            </div>
            <div className="h-4 border-l"></div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-400">
              {p}
            </div>
            <button
              className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
              onClick={() => handleRemove(p)}
            >
              <IconX size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex h-8 items-center justify-center text-xs font-light text-gray-400">
        {data.length === 0 ? 'No file' : `${data.length} file(s)`}
      </div>
    </div>
  )
}
