// src/pages/settings.tsx
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Trash2, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { useUserStore } from '@/stores/user-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useConfirm } from '@/hooks/use-confirm'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import { useUser } from '@/lib/api/queries'
import { DataExportSection } from '@/components/settings/data-export-section'
import { SRS_THRESHOLD_LABELS, SRS_THRESHOLD_DESCRIPTIONS, type SRSThreshold } from '@/data/jlpt'

export function Settings() {
  const { sync, forceSync, isSyncing, lastSyncAt, lastSyncResult, error } = useSync()
  const { clearAuth } = useUserStore()
  const { data: user } = useUser()
  const {
    useActiveAverage,
    setUseActiveAverage,
    averagingMethod,
    setAveragingMethod,
    useCustomThreshold,
    setUseCustomThreshold,
    customThresholdDays,
    setCustomThresholdDays,
    jlptThreshold,
    setJlptThreshold,
    showHiddenItems,
    setShowHiddenItems
  } = useSettingsStore()
  const { confirm, ConfirmDialog } = useConfirm()

  const handleForceSync = async () => {
    const confirmed = await confirm({
      title: 'Force Full Sync?',
      message:
        'This will re-download all your data from WaniKani. Your existing cache will be cleared.',
      confirmText: 'Continue',
      cancelText: 'Cancel',
      variant: 'warning',
    })

    if (confirmed) {
      await forceSync()
    }
  }

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Disconnect & Clear Data?',
      message:
        'This will clear your API token and all locally cached data. This action cannot be undone.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      variant: 'danger',
    })

    if (confirmed) {
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

      {/* Data Export */}
      <DataExportSection />

      {/* Exam Readiness Settings */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Exam Readiness
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-ink-100 dark:text-paper-100">
                SRS Threshold
              </label>
              <InfoTooltip content="Choose what SRS stage counts as 'known' for exam readiness calculations (Jōyō kanji and JLPT approximations). Higher thresholds are stricter - Guru+ (recommended) means kanji must be at Guru stage or higher to count as known." />
            </div>
            <select
              value={jlptThreshold}
              onChange={(e) => setJlptThreshold(e.target.value as SRSThreshold)}
              className="w-full px-4 py-2 text-sm bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-md text-ink-100 dark:text-paper-100 focus:outline-none focus:ring-2 focus:ring-vermillion-500/20"
            >
              {(['apprentice_4', 'guru', 'master', 'enlightened', 'burned'] as SRSThreshold[]).map(
                (threshold) => (
                  <option key={threshold} value={threshold}>
                    {SRS_THRESHOLD_LABELS[threshold]}
                  </option>
                )
              )}
            </select>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-2">
              {SRS_THRESHOLD_DESCRIPTIONS[jlptThreshold]}
            </div>
          </div>
        </div>
      </div>

      {/* Kanji Grid Settings */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Kanji Grid
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-ink-100 dark:text-paper-100">
                Show Removed Items
              </label>
              <InfoTooltip content="Show items that have been removed from the WaniKani curriculum. These are subjects you may have studied before they were removed, but are no longer taught to new students." />
            </div>
            <button
              onClick={() => setShowHiddenItems(!showHiddenItems)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showHiddenItems
                  ? 'bg-vermillion-500'
                  : 'bg-paper-300 dark:bg-ink-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-paper-100 dark:bg-ink-100 transition-transform ${
                  showHiddenItems ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Calculations */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Progress Calculations
        </h2>
        <div className="space-y-6">
          {/* Use Active Average Toggle */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                  Use active learning average
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
                  Excludes extended breaks and vacation periods from pace calculations
                </div>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                <input
                  type="checkbox"
                  checked={useActiveAverage}
                  onChange={(e) => setUseActiveAverage(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-paper-300 dark:bg-ink-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-vermillion-500/20 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-paper-100 dark:after:bg-ink-100 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vermillion-500"></div>
              </div>
            </label>

            {/* Custom Threshold Setting - shown when active average is enabled */}
            {useActiveAverage && (
              <div className="mt-4 pl-4 border-l-2 border-paper-300 dark:border-ink-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Use custom day threshold
                    </span>
                    <InfoTooltip content="By default, the app uses smart filtering to exclude both very long breaks (60+ days) and statistical outliers (3x your median pace). Enable this to use only a specific day threshold that you define, ignoring the statistical outlier detection. This gives you precise control over what counts as a break." />
                  </div>
                  <label className="relative inline-block w-12 h-6 transition duration-200 ease-in-out ml-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomThreshold}
                      onChange={(e) => setUseCustomThreshold(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-paper-300 dark:bg-ink-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-vermillion-500/20 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-paper-100 dark:after:bg-ink-100 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vermillion-500"></div>
                  </label>
                </div>

                {/* Day Threshold Input - shown when custom threshold is enabled */}
                {useCustomThreshold && (
                  <div className="mt-3">
                    <label className="block">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-ink-100 dark:text-paper-100">
                          Exclude levels longer than (days)
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={customThresholdDays}
                        onChange={(e) => setCustomThresholdDays(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-md text-ink-100 dark:text-paper-100 focus:outline-none focus:ring-2 focus:ring-vermillion-500/20"
                      />
                      <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
                        Levels taking {customThresholdDays}+ days will be excluded from your average
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Averaging Method Selection */}
          <div>
            <div className="text-sm font-medium text-ink-100 dark:text-paper-100 mb-3">
              Averaging Method
            </div>
            <div className="space-y-3">
              {/* Trimmed Mean Option */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="averagingMethod"
                  value="trimmed_mean"
                  checked={averagingMethod === 'trimmed_mean'}
                  onChange={(e) => setAveragingMethod(e.target.value as 'trimmed_mean' | 'median')}
                  className="w-4 h-4 text-vermillion-500 border-paper-300 dark:border-ink-300 focus:ring-2 focus:ring-vermillion-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Trimmed Mean (recommended)
                    </span>
                    <InfoTooltip content="Removes the top 10% and bottom 10% of your active learning pace, then averages the remaining 80%. This provides stable, long-term projections that ignore both your fastest and slowest periods. Best for realistic level 60 estimates." />
                  </div>
                  <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
                    Most stable for long-term forecasting
                  </div>
                </div>
              </label>

              {/* Median Option */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="averagingMethod"
                  value="median"
                  checked={averagingMethod === 'median'}
                  onChange={(e) => setAveragingMethod(e.target.value as 'trimmed_mean' | 'median')}
                  className="w-4 h-4 text-vermillion-500 border-paper-300 dark:border-ink-300 focus:ring-2 focus:ring-vermillion-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Median
                    </span>
                    <InfoTooltip content="Uses the middle value of your level completion times. More resistant to extreme outliers but can be influenced by whether you have slightly more fast or slow levels. May produce less stable long-term projections." />
                  </div>
                  <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
                    Simple middle-value approach
                  </div>
                </div>
              </label>
            </div>
          </div>
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
      {ConfirmDialog}
    </div>
  )
}
