'use client'

import { NewTaskModal } from '@/components/modal/new-task'
import { cn } from '@/lib/utils/cn'
import {
  IconList,
  IconNotification,
  IconPencil,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react'
import { ButtonHTMLAttributes, useState } from 'react'

function Button({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'flex aspect-square items-center justify-center text-white transition',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SideMenu() {
  const [newTaskModal, setNewTaskModal] = useState(false)

  return (
    <>
      <div className="z-50 flex w-14 flex-col bg-gray-900">
        <Button
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => setNewTaskModal(true)}
        >
          <IconPlus />
        </Button>
        <Button className=" hover:bg-gray-800">
          <IconList />
        </Button>
        <Button className="hover:bg-gray-800">
          <IconPencil />
        </Button>

        <Button className="mt-auto hover:bg-gray-800">
          <IconNotification />
        </Button>
        <Button className="hover:bg-gray-800">
          <IconSettings />
        </Button>
      </div>

      <NewTaskModal isOpen={newTaskModal} onClose={setNewTaskModal} />
    </>
  )
}
