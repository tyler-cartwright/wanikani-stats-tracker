// src/pages/settings.tsx
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Trash2, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { useUserStore } from '@/stores/user-store'

export function Settings() {
  const { sync, forceSync, isSyncing, lastSyncAt, lastSyncResult, error } = useSync()
  const { clearAuth, user } = useUserStore()

  const handleForceSync = async () => {
    if (confirm('This will re-download all your data from WaniKani. Continue?')) {
      await forceSync()
    }
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to disconnect? This will clear all local data.')) {
      await clearAuth()
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100">
        Settings
      </h1>

      {/* Account Info */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-400 dark:text-paper-300">Username</span>
            <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
              {user?.username ?? 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-400 dark:text-paper-300">Level</span>
            <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
              {user?.level ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Data Sync
        </h2>

        <div className="space-y-4">
          {/* Last Sync Info */}
          <div className="flex items-center gap-3">
            {error ? (
              <AlertCircle className="w-5 h-5 text-vermillion-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-patina-500" />
            )}
            <div>
              <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                {error ? 'Last sync failed' : 'Data synced'}
              </div>
              {lastSyncAt && (
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
                </div>
              )}
            </div>
          </div>

          {/* Last Sync Results */}
          {lastSyncResult && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-paper-100 dark:bg-ink-100 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.subjects}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.assignments}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.reviewStatistics}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Review Stats</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.levelProgressions}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Level Progress</div>
              </div>
            </div>
          )}

          {/* Sync Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => sync()}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 rounded-md font-medium hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              Force Full Sync
            </button>
          </div>

          <p className="text-xs text-ink-400 dark:text-paper-300">
            The values above show how many items were fetched during the last sync. Data is automatically synced in the background. Force full sync re-downloads everything.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-vermillion-500/30 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-vermillion-500 mb-4">
          Danger Zone
        </h2>
        <p className="text-sm text-ink-400 dark:text-paper-300 mb-4">
          Disconnecting will clear your API token and all locally cached data.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth"
        >
          <Trash2 className="w-4 h-4" />
          Disconnect & Clear Data
        </button>
      </div>
    </div>
  )
}
