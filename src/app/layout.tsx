import { SideMenu } from '@/components/layout/side-menu'
import { Provider } from 'jotai'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="text-gray-900 selection:bg-slate-500/25">
        <Provider>
          <div className="flex h-screen">
            <SideMenu />
            <div className="flex-grow">{children}</div>
          </div>
        </Provider>
      </body>
    </html>
  )
}
