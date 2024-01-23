import {
  IconCircle,
  IconEar,
  IconFolderFilled,
  IconLanguage,
  IconSearch,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { ButtonHTMLAttributes, ReactNode } from 'react'

function Button({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        className,
        'flex h-10 items-center gap-2 rounded-md px-4 transition hover:bg-gray-200',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function ButtonGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b p-2 text-sm text-gray-400">{title}</div>
      <div className="flex flex-col gap-1 p-2">{children}</div>
    </div>
  )
}

export function TaskTab() {
  return (
    <div className="flex w-[200px] flex-col border-r bg-gray-100">
      <ButtonGroup title="Type">
        <Button>
          <IconCircle size={18} />
          All types
        </Button>
        <Button>
          <IconEar size={18} />
          Transcribe
        </Button>
        <Button>
          <IconLanguage size={18} />
          Translate
        </Button>
      </ButtonGroup>

      <ButtonGroup title="Group">
        <Button>
          <IconCircle size={18} />
          All groups
        </Button>
        <Button>
          <IconFolderFilled className="text-amber-500" size={18} />
          Group 1
        </Button>
        <Button>
          <IconFolderFilled className="text-indigo-500" size={18} />
          Group 2
        </Button>
      </ButtonGroup>

      <Button className="m-2 mt-auto">
        <IconSearch size={18} />
        Search
      </Button>
    </div>
  )
}
