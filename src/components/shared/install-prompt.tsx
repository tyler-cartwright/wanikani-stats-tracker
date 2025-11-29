import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

const DISMISSED_KEY = 'pwa-install-dismissed'

export function InstallPrompt() {
  const { isInstallable, promptInstall } = useInstallPrompt()
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(DISMISSED_KEY) === 'true'
  })

  useEffect(() => {
    if (isDismissed) {
      sessionStorage.setItem(DISMISSED_KEY, 'true')
    }
  }, [isDismissed])

  if (!isInstallable || isDismissed) return null

  const handleInstall = () => {
    promptInstall()
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
      <div className="bg-paper-200 dark:bg-ink-200 border border-paper-300 dark:border-ink-300 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-vermillion-500 flex items-center justify-center">
            <Download className="w-5 h-5 text-paper-100" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-1">
              Install App
            </h3>
            <p className="text-xs text-ink-400 dark:text-paper-300 mb-3">
              Install WaniKani Stats for quick access and offline support
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 text-xs font-medium bg-vermillion-500 text-paper-100 rounded-md hover:bg-vermillion-600 transition-smooth focus-ring"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100 transition-smooth"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-ink-400 dark:text-paper-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
