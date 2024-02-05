import { PageHeader } from '@/components/layout/page-header'
import { TaskList } from '@/components/layout/task-list'
import { TaskTab } from '@/components/layout/task-tab'

export default function Page() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Tasks</PageHeader>
      <div className="flex flex-grow">
        <TaskTab />
        <div className="relative flex-grow">
          <div className="absolute inset-0 overflow-y-auto">
            <TaskList />
          </div>
        </div>
      </div>
    </div>
  )
}
