import { WindowControls } from './window-controls'

export function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="flex h-8 w-full shrink-0 pl-4 select-none"
    >
      <div data-tauri-drag-region className="flex grow items-center">
        <span data-tauri-drag-region className="text-sm">
          purr
        </span>
      </div>
      <WindowControls />
    </div>
  )
}
