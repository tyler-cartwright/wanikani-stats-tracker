import { format } from 'date-fns'
import { RotateCcw } from 'lucide-react'
import { useResets } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'

export function ResetHistoryNotice() {
  const { data: resets, isLoading: resetsLoading } = useResets()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const isLoading = resetsLoading || isSyncing

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-5 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
        {/* List items */}
        <div className="space-y-2 mb-3">
          <div className="h-4 w-56 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
        </div>
        {/* Disclaimer */}
        <div className="h-3 w-72 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
      </div>
    )
  }

  const confirmed = resets?.filter((r) => r.confirmed_at !== null) ?? []
  if (confirmed.length === 0) return null

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <RotateCcw className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-sm">Reset History</span>
      </div>
      <ul className="space-y-1 text-sm text-ink-600 dark:text-paper-400 mb-2">
        {confirmed.map((r) => (
          <li key={r.confirmed_at}>
            Level {r.original_level} → Level {r.target_level} on{' '}
            {format(new Date(r.confirmed_at!), 'MMM d, yyyy')}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-500 dark:text-paper-500">
        Pre-reset progression data is excluded from calculations on this page.
      </p>
    </div>
  )
}
