import { PageHeader } from '@/components/layout/page-header'
import { TaskTab } from '@/components/layout/task-tab'

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader>Tasks</PageHeader>
      <div className="flex flex-1">
        <TaskTab />
        <div></div>
      </div>
    </div>
  )
}
