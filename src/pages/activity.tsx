import { useMemo } from 'react'
import { useActivityHistory } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { formatLocalDate } from '@/lib/calculations/activity-capture'
import { calculateDailyStreaks } from '@/lib/calculations/daily-streaks'
import { summarizeActivity } from '@/lib/calculations/activity-summary'
import { ActivityStats } from '@/components/activity/activity-stats'
import { ActivityHeatmap } from '@/components/activity/activity-heatmap'
import { ActivityEmptyState } from '@/components/activity/activity-empty-state'
import { YearInReviewCard } from '@/components/activity/year-in-review-card'
import { useDocumentTitle } from '@/hooks/use-document-title'

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 animate-pulse"
          />
        ))}
      </div>
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 w-40 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="h-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function Activity() {
  useDocumentTitle('Activity')
  const { data: history, isLoading } = useActivityHistory()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const stats = useMemo(() => {
    if (!history || history.length === 0) return null
    return {
      streaks: calculateDailyStreaks(history, formatLocalDate(new Date())),
      summary: summarizeActivity(history),
    }
  }, [history])

  if (isLoading || isSyncing) {
    return <LoadingSkeleton />
  }

  if (!history || history.length === 0 || !stats) {
    return <ActivityEmptyState />
  }

  return (
    <div className="space-y-8">
      <ActivityStats streaks={stats.streaks} summary={stats.summary} />
      <ActivityHeatmap history={history} />
      <YearInReviewCard history={history} />
    </div>
  )
}
