import { cn } from '@/lib/utils/cn'
import { IconCheck } from '@tabler/icons-react'
import { filesize } from 'filesize'
import { forwardRef } from 'react'

export interface ModelItem {
  name: string
  size: number
}

export interface ModelSwitchProps {
  models: ModelItem[]
  value: string
  onChange: (modelName: string) => void
}

const ModelSwitch = forwardRef<HTMLDivElement, ModelSwitchProps>(
  ({ models, value, onChange }, ref) => {
    return (
      <div
        ref={ref}
        className="min-h-[200px] overflow-y-auto rounded-md border"
      >
        <div className="flex flex-col divide-y">
          {models.map((model) => (
            <button
              key={model.name}
              type="button"
              className="flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-100"
              onClick={() => onChange(model.name)}
            >
              <div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {model.name}
                </div>
                <div className="text-sm text-gray-400">
                  {filesize(model.size)}
                </div>
              </div>
              <IconCheck
                className={cn(
                  'flex-shrink-0',
                  model.name !== value && 'hidden',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    )
  },
)

ModelSwitch.displayName = 'ModelSwitch'

export { ModelSwitch }
