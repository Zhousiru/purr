'use client'

import { NewTaskModal } from '@/components/modal/new-task'
import { cn } from '@/lib/utils/cn'
import {
  IconEar,
  IconList,
  IconNotification,
  IconPencil,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react'
import { usePathname, useRouter } from 'next/navigation'
import { ButtonHTMLAttributes, ReactNode, useMemo, useState } from 'react'

function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'flex aspect-square items-center justify-center text-white transition hover:bg-gray-800',
        className,
      )}
      {...props}
    />
  )
}

interface MenuItem {
  name: string
  pathname: string
  icon: ReactNode
}

const menu: {
  top: MenuItem[]
  bottom: MenuItem[]
} = {
  top: [
    {
      name: 'Tasks',
      pathname: '/tasks',
      icon: <IconList />,
    },
    {
      name: 'Editor',
      pathname: '/editor',
      icon: <IconPencil />,
    },
    {
      name: 'Whisper Server',
      pathname: '/whisper-server',
      icon: <IconEar />,
    },
  ],
  bottom: [
    {
      name: 'Notifications',
      pathname: '/notifications',
      icon: <IconNotification />,
    },
    {
      name: 'Settings',
      pathname: '/settings',
      icon: <IconSettings />,
    },
  ],
}

export function SideMenu() {
  const [newTaskModal, setNewTaskModal] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const indicatorTop = useMemo(() => {
    const topIndex = menu.top.findIndex((item) => item.pathname === pathname)
    if (topIndex !== -1) {
      return `${(topIndex + 1) * 56}px`
    }

    const bottomIndex = menu.bottom.findIndex(
      (item) => item.pathname === pathname,
    )
    if (bottomIndex !== -1) {
      return `calc(100vh - ${(menu.bottom.length - bottomIndex) * 56}px)`
    }

    return ''
  }, [pathname])

  return (
    <>
      <div className="relative z-50 flex w-14 flex-shrink-0 flex-col bg-gray-900">
        <Button
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => setNewTaskModal(true)}
        >
          <IconPlus />
        </Button>

        {menu.top.map((item) => (
          <Button
            key={item.pathname}
            title={item.name}
            onClick={() => router.push(item.pathname)}
          >
            {item.icon}
          </Button>
        ))}

        {menu.bottom.map(({ name, pathname, icon }, index) => (
          <Button
            key={pathname}
            title={name}
            className={cn(index === 0 && 'mt-auto')}
            onClick={() => router.push(pathname)}
          >
            {icon}
          </Button>
        ))}

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 flex aspect-square items-center transition-all',
            indicatorTop === '' && 'hidden',
          )}
          style={{ top: indicatorTop }}
        >
          <div className="h-8 w-1 bg-blue-500"></div>
        </div>
      </div>

      <NewTaskModal isOpen={newTaskModal} onClose={setNewTaskModal} />
    </>
  )
}
