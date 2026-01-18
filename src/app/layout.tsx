import { JotaiProvider } from '@/components/common/jotai-provider'
import { RegisterEvents } from '@/components/common/register-events'
import { SideMenu } from '@/components/layout/side-menu'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script src="http://localhost:8097" async></script>
      </head>
      <body className="max-h-screen overflow-hidden text-gray-900 selection:bg-slate-500/25">
        <RegisterEvents />

        <JotaiProvider>
          <div className="flex h-screen">
            <SideMenu />
            <div className="grow">{children}</div>
          </div>
        </JotaiProvider>
      </body>
    </html>
  )
}
