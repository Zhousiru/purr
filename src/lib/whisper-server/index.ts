import { getMonitor } from '@/atoms/whisper-server'
import { WhisperServerConfig } from '@/types/whisper-server'
import { path } from '@tauri-apps/api'
import { cmd } from '../commands'
import { waitUntilExit } from '../events/utils'

export async function startWhisperServer(config: WhisperServerConfig) {
  if (await cmd.isWhisperServerRunning()) {
    // App might be refreshed unexpectedly, and lost the state of the server.
    // We should kill the server before starting a new one.
    killWhisperServer()
    await waitUntilExit()
  }

  await cmd.launchWhisperServer({
    program: await path.join(config.startupDir, 'python'),
    args: [
      await path.join(config.startupDir, 'src', 'main.py'),
      '--host',
      config.host,
      '--port',
      config.port.toString(),
      '--device',
      config.device,
      '--type',
      config.quantizationType,
      '--model',
      await path.join(config.modelDir, config.model),
    ],
  })

  // We will connect to the monitor in the event handler after the server is ready.
}

export async function killWhisperServer() {
  getMonitor().close()
  await cmd.killWhisperServer()
}
