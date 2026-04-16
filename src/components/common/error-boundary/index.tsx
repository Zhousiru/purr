import { Button } from '@/components/ui/button'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Component, ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <IconAlertTriangle size={24} className="text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Something went wrong</p>
            <p className="text-muted-foreground font-mono text-xs wrap-break-word">
              {this.state.error.message || 'Unknown error'}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-8 px-4 text-xs"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      </div>
    )
  }
}
