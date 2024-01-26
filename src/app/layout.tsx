import { SideMenu } from '@/components/layout/side-menu'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="selection:bg-slate-500/25">
        <div className="flex h-screen">
          <SideMenu />
          <div className="flex-grow">{children}</div>
        </div>
      </body>
    </html>
  )
}
