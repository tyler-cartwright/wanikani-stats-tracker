// src/components/shared/initial-sync.tsx
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { useSyncStatus } from '@/lib/api/queries'

interface InitialSyncProps {
  children: React.ReactNode
}

export function InitialSync({ children }: InitialSyncProps) {
  const { sync, isSyncing, progress, error } = useSync()
  const { data: syncStatus, isLoading: checkingStatus } = useSyncStatus()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function initialize() {
      console.log('[INITIAL-SYNC] Initialize called - checkingStatus:', checkingStatus, 'initialized:', initialized)
      if (checkingStatus || initialized) return

      console.log('[INITIAL-SYNC] syncStatus:', syncStatus)
      // If we have cached data, show the app immediately
      if (syncStatus?.hasData) {
        console.log('[INITIAL-SYNC] Has cached data, initializing and triggering background sync')
        setInitialized(true)
        // Trigger background delta sync
        sync().catch(console.error)
        return
      }

      // No cached data - need to do initial sync
      console.log('[INITIAL-SYNC] No cached data, starting initial sync')
      try {
        await sync()
        console.log('[INITIAL-SYNC] Initial sync completed successfully')
        setInitialized(true)
      } catch (err) {
        console.error('[INITIAL-SYNC] Initial sync failed:', err)
        // Still allow access with error state
        setInitialized(true)
      }
    }

    initialize()
  }, [checkingStatus, syncStatus, initialized, sync])

  // Show loading during initial check
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-400 dark:text-paper-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking local data...</span>
        </div>
      </div>
    )
  }

  // Show progress during initial sync (no cached data)
  if (!initialized && isSyncing) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
          <div className="text-center mb-6">
            <Loader2 className="w-12 h-12 animate-spin text-vermillion-500 mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100">
              Setting up WaniTrack
            </h2>
            <p className="text-sm text-ink-400 dark:text-paper-300 mt-2">
              Downloading your WaniKani data...
            </p>
          </div>

          {progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {progress.phase === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-patina-500" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-vermillion-500" />
                )}
                <span className="text-ink-100 dark:text-paper-100">{progress.message}</span>
              </div>

              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vermillion-500 rounded-full transition-all duration-300"
                  style={{
                    width:
                      progress.phase === 'subjects'
                        ? '25%'
                        : progress.phase === 'assignments'
                          ? '50%'
                          : progress.phase === 'reviewStats'
                            ? '75%'
                            : progress.phase === 'levelProgressions'
                              ? '90%'
                              : progress.phase === 'complete'
                                ? '100%'
                                : '10%',
                  }}
                />
              </div>
            </div>
          )}

          {progress?.isFullSync && (
            <p className="text-xs text-ink-400 dark:text-paper-300 text-center mt-4">
              This only happens once. Future loads will be instant.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (!initialized && error) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md text-center">
          <AlertCircle className="w-12 h-12 text-vermillion-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
            Sync Failed
          </h2>
          <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">{error}</p>
          <button
            onClick={() => sync()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
