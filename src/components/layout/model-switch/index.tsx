import { cn } from '@/lib/utils/cn'
import { ModelItem } from '@/types/whisper-server'
import { IconCheck } from '@tabler/icons-react'
import { filesize } from 'filesize'
import { Ref } from 'react'

export interface ModelSwitchProps {
  models: ModelItem[]
  value: string
  onChange: (modelName: string) => void
  ref?: Ref<HTMLDivElement>
}

const ModelSwitch = ({ models, value, onChange, ref }: ModelSwitchProps) => {
  return (
    <div ref={ref} className="overflow-y-auto rounded-md border border-border">
      <div className="flex flex-col divide-y">
        {models.map((model) => (
          <button
            key={model.name}
            type="button"
            className="flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted"
            onClick={() => onChange(model.name)}
          >
            <div className="w-full">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                {model.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {filesize(model.size)}
              </div>
            </div>
            <IconCheck
              className={cn(
                'flex-shrink-0',
                model.name !== value && 'hidden',
              )}
              size={18}
            />
          </button>
        ))}

        {models.length === 0 && (
          <div className="flex h-10 items-center justify-center text-sm text-muted-foreground">
            No models
          </div>
        )}
      </div>
    </div>
  )
}

ModelSwitch.displayName = 'ModelSwitch'

export { ModelSwitch }
