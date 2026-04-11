import { isReadyAtom, isRunningAtom } from '@/atoms/whisper-server'
import { cn } from '@/lib/utils/cn'
import {
  IconBolt,
  IconEar,
  IconNotification,
  IconPencil,
  IconSettings,
} from '@tabler/icons-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { ReactNode, useMemo } from 'react'
import { SidebarTaskList } from './SidebarTaskList'
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
        'flex h-9 w-full items-center gap-3 rounded-xl px-2 text-sm',
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

  const menu: { top: MenuItem[]; bottom: MenuItem[] } = useMemo(
    () => ({
      top: [
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

  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="flex w-[300px] shrink-0 flex-col p-2">
      <NavButton
        icon={<IconBolt size={18} />}
        label="Launchpad"
        active={pathname === '/launchpad'}
        onClick={() => navigate({ to: '/launchpad' })}
      />

      <nav className="flex flex-col">
        {menu.top.map((item) => (
          <NavButton
            key={item.pathname}
            icon={item.icon}
            label={item.name}
            active={pathname === item.pathname}
            onClick={() => navigate({ to: item.pathname })}
          />
        ))}
      </nav>

      <SidebarTaskList />

      <nav className="mt-auto flex flex-col gap-0.5">
        {menu.bottom.map((item) => (
          <NavButton
            key={item.pathname}
            icon={item.icon}
            label={item.name}
            active={pathname === item.pathname}
            onClick={() => navigate({ to: item.pathname })}
          />
        ))}
      </nav>
    </div>
  )
}
