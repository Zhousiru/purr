'use client'

import { isReadyAtom, isRunningAtom } from '@/atoms/whisper-server'
import { NewTaskModal } from '@/components/modal/new-tasks'
import { WhisperServerGuardModal } from '@/components/modal/whisper-server-guard'
import { useWhisperServerGuard } from '@/components/modal/whisper-server-guard/use-whisper-server-guard'
import { cn } from '@/lib/utils/cn'
import {
  IconEar,
  IconList,
  IconNotification,
  IconPencil,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react'
import { useAtomValue } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useMemo, useState } from 'react'
import { WhisperConnectionIndicator } from './WhisperConnectionIndicator'

interface MenuItem {
  name: string
  pathname: string
  icon: ReactNode
}

function NavButton({
  icon,
  label,
  active,
  onClick,
  className,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-9 w-full items-center gap-3 rounded-xl px-2 text-sm font-medium',
        active && 'bg-black/5',
        className,
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export function SideMenu() {
  const isWhisperRunning = useAtomValue(isRunningAtom)
  const isWhisperReady = useAtomValue(isReadyAtom)
  const [newTaskModal, setNewTaskModal] = useState(false)
  const { register: guardRegister, guard } = useWhisperServerGuard()

  async function handleAddTask() {
    guard(() => setNewTaskModal(true))
  }

  const menu: { top: MenuItem[]; bottom: MenuItem[] } = useMemo(
    () => ({
      top: [
        { name: 'Tasks', pathname: '/tasks', icon: <IconList size={18} /> },
        { name: 'Editor', pathname: '/editor', icon: <IconPencil size={18} /> },
        {
          name: 'Whisper Server',
          pathname: '/whisper-server',
          icon: (
            <div className="relative h-[18px] w-[18px]">
              <div
                className={cn(
                  'absolute inset-0 opacity-100 transition duration-500',
                  isWhisperRunning && !isWhisperReady && 'opacity-0',
                )}
              >
                <IconEar size={18} />
              </div>
              <div
                className={cn(
                  'absolute inset-0 opacity-0 transition duration-500',
                  isWhisperRunning && !isWhisperReady && 'opacity-100',
                )}
              >
                <IconEar size={18} className="animate-pulse" />
              </div>
              <WhisperConnectionIndicator className="absolute right-0 bottom-0" />
            </div>
          ),
        },
      ],
      bottom: [
        {
          name: 'Notifications',
          pathname: '/notifications',
          icon: <IconNotification size={18} />,
        },
        {
          name: 'Settings',
          pathname: '/settings',
          icon: <IconSettings size={18} />,
        },
      ],
    }),
    [isWhisperReady, isWhisperRunning],
  )

  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      <div className="flex w-[300px] shrink-0 flex-col p-2">
        <button
          onClick={handleAddTask}
          className="mb-4 flex h-9 w-full items-center gap-3 rounded-xl bg-blue-500 px-2 text-sm font-medium text-white"
        >
          <IconPlus size={18} />
          <span>New Task</span>
        </button>

        <nav className="flex flex-col">
          {menu.top.map((item) => (
            <NavButton
              key={item.pathname}
              icon={item.icon}
              label={item.name}
              active={pathname === item.pathname}
              onClick={() => router.push(item.pathname)}
            />
          ))}
        </nav>

        <nav className="mt-auto flex flex-col gap-0.5">
          {menu.bottom.map((item) => (
            <NavButton
              key={item.pathname}
              icon={item.icon}
              label={item.name}
              active={pathname === item.pathname}
              onClick={() => router.push(item.pathname)}
            />
          ))}
        </nav>
      </div>

      <NewTaskModal isOpen={newTaskModal} onClose={setNewTaskModal} />
      <WhisperServerGuardModal {...guardRegister} />
    </>
  )
}
