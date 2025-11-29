import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-vermillion-500/10 dark:bg-vermillion-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-vermillion-500" />
            </div>

            <h1 className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100 mb-3">
              Something went wrong
            </h1>

            <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-ink-400 dark:text-paper-300 cursor-pointer hover:text-ink-100 dark:hover:text-paper-100 transition-smooth">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-paper-100 dark:bg-ink-100 rounded text-xs text-ink-400 dark:text-paper-300 overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth focus-ring"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
