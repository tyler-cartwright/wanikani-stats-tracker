import { useReviewStatistics } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'

interface DistributionBucket {
  label: string
  range: string
  count: number
  percentage: number
  color: string
  darkColor: string
  bgColor: string
}

export function AccuracyDistribution() {
  const { data: reviewStats, isLoading } = useReviewStatistics()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  // Calculate distribution buckets
  const buckets: DistributionBucket[] = [
    { label: 'Excellent', range: '90-100%', count: 0, percentage: 0, color: 'text-patina-500', darkColor: 'dark:text-patina-400', bgColor: 'bg-patina-500' },
    { label: 'Good', range: '75-89%', count: 0, percentage: 0, color: 'text-ink-100', darkColor: 'dark:text-paper-100', bgColor: 'bg-ink-400' },
    { label: 'Fair', range: '60-74%', count: 0, percentage: 0, color: 'text-ochre', darkColor: 'dark:text-ochre', bgColor: 'bg-ochre' },
    { label: 'Poor', range: '0-59%', count: 0, percentage: 0, color: 'text-vermillion-500', darkColor: 'dark:text-vermillion-400', bgColor: 'bg-vermillion-500' },
  ]

  if (reviewStats) {
    // Count items in each bucket
    reviewStats.forEach((stat) => {
      // Exclude hidden items - they're not in active review rotation
      if (stat.hidden) return

      const accuracy = stat.percentage_correct

      if (accuracy >= 90) {
        buckets[0].count++
      } else if (accuracy >= 75) {
        buckets[1].count++
      } else if (accuracy >= 60) {
        buckets[2].count++
      } else {
        buckets[3].count++
      }
    })

    // Calculate percentages
    const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
    if (total > 0) {
      buckets.forEach((bucket) => {
        bucket.percentage = parseFloat(((bucket.count / total) * 100).toFixed(2))
      })
    }
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1)
  const totalItems = buckets.reduce((sum, b) => sum + b.count, 0)

  if (isLoading || isSyncing) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />

        {/* Buckets */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              {/* Label and stats row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-8 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  <div className="h-3 w-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-paper-300 dark:border-ink-300">
          <div className="h-4 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mx-auto" />
        </div>
      </div>
    )
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
        Accuracy Distribution
      </h2>

      <div className="space-y-4">
        {buckets.map((bucket) => (
          <div key={bucket.label}>
            <div className="flex items-center justify-between mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${bucket.color} ${bucket.darkColor}`}>
                  {bucket.label}
                </span>
                <span className="text-ink-400 dark:text-paper-400 text-xs">
                  {bucket.range}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-ink-100 dark:text-paper-100 font-semibold tabular-nums">
                  {bucket.count}
                </span>
                <span className="text-ink-400 dark:text-paper-300 text-xs w-14 text-right tabular-nums">
                  {bucket.percentage.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
              <div
                className={`h-full ${bucket.bgColor} rounded-full transition-all duration-slow ease-out`}
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-paper-300 dark:border-ink-300">
        <div className="text-sm text-ink-400 dark:text-paper-300 text-center">
          {totalItems.toLocaleString()} items tracked
        </div>
      </div>
    </div>
  )
}
