import { getMonitor, getWhisperServerConfig } from '@/atoms/whisper-server'
import { ApiResponse, WhisperServerConfig } from '@/types/whisper-server'
import { cmd } from '../commands'
import { waitUntilExit } from '../events/utils'
import { joinPath } from '../utils/path'

export async function startWhisperServer(config: WhisperServerConfig) {
  if (await cmd.isWhisperServerRunning()) {
    // App might be refreshed unexpectedly, and lost the state of the server.
    // We should kill the server before starting a new one.
    killWhisperServer()
    await waitUntilExit()
  }

  await cmd.launchWhisperServer({
    basePath: config.startupDir,
    args: [
      joinPath(config.startupDir, 'src', 'main.py'),
      '--host',
      config.host,
      '--port',
      config.port.toString(),
      '--device',
      config.device,
      '--type',
      config.quantizationType,
      '--model',
      joinPath(config.modelDir, config.model),
    ],
  })

  // We will connect to the monitor in the event handler after the server is ready.
}

export async function killWhisperServer() {
  getMonitor().close()
  await cmd.killWhisperServer()
}

export async function addWhisperServerTask(
  name: string,
  path: string,
  options: { lang: string; prompt: string; vad: boolean },
) {
  const config = getWhisperServerConfig()

  return cmd.submitTranscriptionTask({
    url: `http://${config.host}:${config.port}/add-task`,
    name,
    path,
    options,
  })
}

export async function cancelWhisperServerTask(name: string) {
  const config = getWhisperServerConfig()

  const url = new URL(`http://${config.host}:${config.port}/cancel-task`)
  url.searchParams.set('name', name)

  const resp: ApiResponse = await (await fetch(url)).json()

  if (resp.status === 'error') {
    throw new Error(resp.msg)
  }
}
