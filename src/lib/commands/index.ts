import { DurationResult } from '@/types/commands'
import { ModelItem } from '@/types/whisper-server'
import { invoke, InvokeArgs } from '@tauri-apps/api/tauri'

export type CommandFunction<T, P> = T extends null
  ? () => Promise<P>
  : (args: T) => Promise<P>

export interface Commands {
  listModels: CommandFunction<
    {
      path: string
    },
    ModelItem[]
  >
  launchWhisperServer: CommandFunction<
    { program: string; args: string[] },
    void
  >
  killWhisperServer: CommandFunction<null, void>
  getAudioDurations: CommandFunction<{ paths: string[] }, Array<DurationResult>>
}

export const cmd = new Proxy(
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
