// Usage statistics notice + opt-out control (Settings and the Setup page).
// The free, simple way to object that UK PECR's statistical-purposes
// exception requires. See docs/analytics-plan.md §3.

import { useSyncExternalStore } from 'react'
import {
  getAnalyticsOptOut,
  hasGlobalPrivacyControl,
  setAnalyticsOptOut,
  subscribeAnalyticsOptOut,
} from '@/lib/analytics/track'

export const USAGE_STATS_SUMMARY =
  'WaniTrack sends a few anonymous usage statistics to its own server: which pages are opened, ' +
  'whether connecting succeeded, and error types. Your account is represented only by a one-way ' +
  'hash of its internal ID. Your API token, username and study data are never sent, nothing is ' +
  'shared with third parties, and records are deleted after 90 days.'

export function useAnalyticsOptOut(): boolean {
  return useSyncExternalStore(subscribeAnalyticsOptOut, getAnalyticsOptOut, () => false)
}

/** Full toggle row, for the Settings page. */
export function UsageStatsToggle() {
  const optOut = useAnalyticsOptOut()
  const gpc = hasGlobalPrivacyControl()
  const sharing = !optOut && !gpc

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="usage-stats-toggle"
          className="text-sm font-medium text-ink-100 dark:text-paper-100"
        >
          Share anonymous usage statistics
        </label>
        <button
          id="usage-stats-toggle"
          role="switch"
          aria-checked={sharing}
          disabled={gpc}
          onClick={() => setAnalyticsOptOut(!optOut)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            sharing ? 'bg-vermillion-500' : 'bg-paper-300 dark:bg-ink-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-paper-100 dark:bg-ink-100 transition-transform ${
              sharing ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <p className="text-xs text-ink-400 dark:text-paper-300">{USAGE_STATS_SUMMARY}</p>
      {gpc && (
        <p className="text-xs text-ink-400 dark:text-paper-300">
          Your browser sends a Global Privacy Control signal, so nothing is sent.
        </p>
      )}
    </div>
  )
}

/** One-line opt-out link, for the Setup page footer. */
export function UsageStatsInlineOptOut() {
  const optOut = useAnalyticsOptOut()
  if (hasGlobalPrivacyControl()) return null
  return (
    <button
      type="button"
      onClick={() => setAnalyticsOptOut(!optOut)}
      className="underline hover:text-ink-100 dark:hover:text-paper-100 transition-colors"
    >
      {optOut ? 'Usage statistics off — turn back on' : "Don't send usage statistics"}
    </button>
  )
}
