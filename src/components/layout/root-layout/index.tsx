import { Outlet } from '@tanstack/react-router'
import { JotaiProvider } from '@/components/common/jotai-provider'
import { RegisterEvents } from '@/components/common/register-events'
import { SideMenu } from '@/components/layout/side-menu'
import { TitleBar } from '@/components/layout/title-bar'

export function RootLayout() {
  return (
    <JotaiProvider>
      <RegisterEvents />
      <div className="flex h-screen flex-col">
        <TitleBar />
        <div className="flex min-h-0 grow">
          <SideMenu />
          <div className="grow overflow-hidden rounded-tl-2xl bg-white">
            <Outlet />
          </div>
        </div>
      </div>
    </JotaiProvider>
  )
}
