import { PageHeader } from '@/components/layout/page-header'

export default function Page() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Editor</PageHeader>
      <div className="flex flex-grow divide-x">
        <div className="w-[80px] bg-gray-100"></div>
        <div className="w-[350px] bg-gray-100"></div>
      </div>
    </div>
  )
}
