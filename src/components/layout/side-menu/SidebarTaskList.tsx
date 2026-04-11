import { taskGroupsAtom, taskListAtom } from '@/atoms/tasks'
import { TaskRow } from '@/components/common/task-row'
import { TaskAtom } from '@/lib/db/task-atom-storage'
import { store } from '@/lib/store'
import { cn } from '@/lib/utils/cn'
import { Task } from '@/types/tasks'
import { IconChevronDown } from '@tabler/icons-react'
import { useAtomValue } from 'jotai'
import { useState } from 'react'

function TaskGroup({
  group,
  tasks,
}: {
  group: string
  tasks: TaskAtom<Task>[]
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-9 w-full items-center gap-2 px-2 text-sm"
      >
        <IconChevronDown
          size={16}
          className={cn('shrink-0 transition', collapsed && '-rotate-90')}
        />
        <span className="truncate">{group}</span>
      </button>
      {!collapsed && (
        <div className="flex flex-col">
          {tasks.map((taskAtom, i) => (
            <TaskRow key={i} taskAtom={taskAtom} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SidebarTaskList() {
  const groups = useAtomValue(taskGroupsAtom)
  const allTasks = useAtomValue(taskListAtom)

  if (allTasks.length === 0) return null

  const grouped = groups.map((group) => ({
    group,
    tasks: allTasks.filter((a) => store.get(a).group === group),
  }))

  return (
    <div className="mt-4 flex min-h-0 flex-col overflow-y-auto">
      <div className="px-2 text-xs font-medium opacity-50">Tasks</div>
      <div className="mt-1 flex flex-col gap-0.5">
        {grouped.map(({ group, tasks }) =>
          tasks.length > 0 ? (
            <TaskGroup key={group} group={group} tasks={tasks} />
          ) : null,
        )}
      </div>
    </div>
  )
}
