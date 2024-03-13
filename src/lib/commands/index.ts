import { DurationResult, TranscriptionSubmissionResult } from '@/types/commands'
import { ModelItem } from '@/types/whisper-server'
import { InvokeArgs, invoke } from '@tauri-apps/api/tauri'

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
  submitTranscriptionTask: CommandFunction<
    {
      url: string
      namedPaths: Array<{ name: string; path: string }>
      options: { lang: string; prompt: string; vad: boolean }
    },
    TranscriptionSubmissionResult
  >
  isWhisperServerRunning: CommandFunction<null, boolean>
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
