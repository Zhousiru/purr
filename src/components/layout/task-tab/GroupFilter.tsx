import { guardedTaskGroupFilterAtom, taskGroupsAtom } from '@/atoms/tasks'
import { IconCircle, IconFolderFilled } from '@tabler/icons-react'
import { useAtom, useAtomValue } from 'jotai'
import { TabButton, TabButtonGroup } from './TabButton'

const colorPlate = ['#ff9800', '#e91e63', '#4caf50', '#2196f3', '#673ab7']
const getIconColor = (index: number) => colorPlate[index % colorPlate.length]

export function GroupFilter() {
  const groups = useAtomValue(taskGroupsAtom)
  const [filter, setFilter] = useAtom(guardedTaskGroupFilterAtom)

  return (
    <TabButtonGroup title="Group">
      <TabButton onClick={() => setFilter('')} active={!filter}>
        <IconCircle size={18} />
        All groups
      </TabButton>

      {groups.map((group, index) => (
        <TabButton
          key={group}
          onClick={() => setFilter(group)}
          active={filter === group}
        >
          <IconFolderFilled
            size={18}
            // TODO: Fix icon color by using localStorage
            style={{ color: getIconColor(index) }}
            className="flex-shrink-0"
          />
          <div className="overflow-hidden text-ellipsis whitespace-normal">
            {group}
          </div>
        </TabButton>
      ))}
    </TabButtonGroup>
  )
}
