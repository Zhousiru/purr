'use client'

import { cn } from '@/lib/utils/cn'
import { IconX } from '@tabler/icons-react'
import { forwardRef } from 'react'

function getFilename(path: string) {
  return path.split(/\/|\\/).pop()
}

interface FileListProps {
  value: string[]
  onChange: (data: string[]) => void
  className?: string
}

export const FileList = forwardRef<HTMLDivElement, FileListProps>(
  function FileList({ value, onChange, className }, ref) {
    function handleRemove(path: string) {
      onChange(value.filter((f) => f !== path))
    }

    return (
      <div
        className={cn(
          'relative overflow-y-auto rounded-md border bg-gray-50',
          className,
        )}
        ref={ref}
      >
        <div className="absolute inset-0">
          <div>
            {value.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 border-b bg-white p-2 last:shadow-sm"
              >
                <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {getFilename(p)}
                </div>

                {/* TODO: Display path properly. */}
                {/* <div className="h-4 border-l"></div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-400">
              {p}
            </div> */}

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
            {value.length === 0 ? 'No files' : `${value.length} file(s)`}
          </div>
        </div>
      </div>
    )
  },
)
