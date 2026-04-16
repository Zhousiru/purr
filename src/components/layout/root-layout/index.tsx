import { ErrorBoundary } from '@/components/common/error-boundary'
import { ErrorTrigger } from '@/components/common/error-boundary/trigger'
import { JotaiProvider } from '@/components/common/jotai-provider'
import { RegisterEvents } from '@/components/common/register-events'
import { SideMenu } from '@/components/layout/side-menu'
import { TitleBar } from '@/components/layout/title-bar'
import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import { Group, Panel, Separator } from 'react-resizable-panels'

export function RootLayout() {
  return (
    <JotaiProvider>
      <RegisterEvents />
      <div className="flex h-full flex-col">
        <TitleBar />
        <ErrorBoundary>
          <ErrorTrigger scope="outer" />
          <div className="relative grow">
            <div className="absolute inset-0">
              <Group
                orientation="horizontal"
                id="root-layout"
                className="h-full"
              >
                <Panel
                  id="side-menu"
                  defaultSize="300px"
                  minSize="220px"
                  maxSize="480px"
                >
                  <SideMenu />
                </Panel>

                <Separator />

                <Panel
                  id="content"
                  className="bg-background overflow-hidden rounded-tl-xl"
                >
                  <ErrorBoundary>
                    <ErrorTrigger scope="inner" />
                    <Outlet />
                  </ErrorBoundary>
                </Panel>
              </Group>
            </div>
          </div>
        </ErrorBoundary>
      </div>
      <Toaster
        position="bottom-right"
        gutter={8}
        containerStyle={{ bottom: 16, right: 16 }}
      />
    </JotaiProvider>
  )
}
