'use client'

import {
  getMonitorStatus,
  isReadyAtom,
  isRunningAtom,
} from '@/atoms/whisper-server'
import { NewTaskModal } from '@/components/modal/new-tasks'
import { WhisperServerNeedConfigure } from '@/components/modal/whisper-server-need-configure'
import { useWhisperNeedConfigureModal } from '@/components/modal/whisper-server-need-configure/use-whisper-need-configure-modal'
import { WhisperServerSpinner } from '@/components/modal/whisper-server-spinner'
import { useWhisperServerLauncher } from '@/components/modal/whisper-server-spinner/use-whisper-server-launcher'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
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
import {
  ButtonHTMLAttributes,
  ReactNode,
  forwardRef,
  useMemo,
  useState,
} from 'react'
import { WhisperConnectionIndicator } from './WhisperConnectionIndicator'

const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'flex aspect-square items-center justify-center text-white transition hover:bg-gray-800',
        className,
      )}
      {...props}
    />
  )
})

interface MenuItem {
  name: string
  pathname: string
  icon: ReactNode
}

export function SideMenu() {
  const isWhisperRunning = useAtomValue(isRunningAtom)
  const isWhisperReady = useAtomValue(isReadyAtom)

  const [newTaskModal, setNewTaskModal] = useState(false)

  const { register: configureModalRegister, checkConfigured } =
    useWhisperNeedConfigureModal()
  const { register: spinnerModalRegister, launch: launchWhisperServer } =
    useWhisperServerLauncher()

  async function handleAddTask() {
    if (!checkConfigured()) {
      return
    }
    if (getMonitorStatus() !== 'connected') {
      if (await launchWhisperServer()) {
        setNewTaskModal(true)
      }
      return
    }
    setNewTaskModal(true)
  }

  const menu: {
    top: MenuItem[]
    bottom: MenuItem[]
  } = useMemo(
    () => ({
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
          icon: (
            <div className="relative h-[24px] w-[24px]">
              <div
                className={cn(
                  'absolute inset-0 opacity-100 transition duration-500',
                  isWhisperRunning && !isWhisperReady && 'opacity-0',
                  !isWhisperRunning && 'text-gray-400',
                )}
              >
                <IconEar />
              </div>

              <div
                className={cn(
                  'absolute inset-0 opacity-0 transition duration-500',
                  isWhisperRunning && !isWhisperReady && 'opacity-100',
                )}
              >
                <IconEar className="animate-pulse" />
              </div>

              <WhisperConnectionIndicator className="absolute bottom-0 right-0" />
            </div>
          ),
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
    }),
    [isWhisperReady, isWhisperRunning],
  )

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
  }, [menu.bottom, menu.top, pathname])

  return (
    <>
      <TooltipGroup>
        <div className="relative z-50 flex w-14 flex-shrink-0 flex-col bg-gray-900">
          <Button
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleAddTask}
          >
            <IconPlus />
          </Button>

          {menu.top.map((item) => (
            <Tooltip key={item.pathname} content={item.name} placement="right">
              <Button onClick={() => router.push(item.pathname)}>
                {item.icon}
              </Button>
            </Tooltip>
          ))}

          {menu.bottom.map((item, index) => (
            <Tooltip key={item.pathname} content={item.name} placement="right">
              <Button
                key={item.pathname}
                className={cn(index === 0 && 'mt-auto')}
                onClick={() => router.push(item.pathname)}
              >
                {item.icon}
              </Button>
            </Tooltip>
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
      </TooltipGroup>

      <NewTaskModal isOpen={newTaskModal} onClose={setNewTaskModal} />
      <WhisperServerNeedConfigure {...configureModalRegister} />
      <WhisperServerSpinner {...spinnerModalRegister} />
    </>
  )
}
