import { invoke } from '@tauri-apps/api'
import { InvokeArgs } from '@tauri-apps/api/tauri'

export interface Commands {
  listModels: (args: {
    path: string
  }) => Promise<{ name: string; size: number }[]>
}

export const commands = new Proxy(
  {},
  {
    get(target, p, receiver) {
      return (args: InvokeArgs) => {
        if (typeof p !== 'string') {
          return
        }

        const cmdName = p.replace(/([A-Z])/g, '_$1').toLowerCase()
        return invoke(cmdName, args)
      }
    },
  },
) as Commands
