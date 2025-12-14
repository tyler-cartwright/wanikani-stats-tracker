import { ProgressBar } from '@/components/shared/progress-bar'
import { useReviewStatistics, useSubjects } from '@/lib/api/queries'
import { calculateAccuracyMetrics } from '@/lib/calculations/accuracy'
import { useSyncStore } from '@/stores/sync-store'

interface TypeData {
  type: string
  accuracy: number
  count: number
}

export function TypeBreakdown() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || isSyncing

  const metrics = reviewStats && subjects
    ? calculateAccuracyMetrics(reviewStats, subjects)
    : null

  // Count items by type from review stats
  const typeCounts = reviewStats
    ? reviewStats.reduce(
        (acc, stat) => {
          // Exclude hidden items - they're not in active review rotation
          if (stat.hidden) return acc
          const type = stat.subject_type === 'kana_vocabulary' ? 'vocabulary' : stat.subject_type
          if (type === 'radical') acc.radicals++
          else if (type === 'kanji') acc.kanji++
          else if (type === 'vocabulary') acc.vocabulary++
          return acc
        },
        { radicals: 0, kanji: 0, vocabulary: 0 }
      )
    : { radicals: 0, kanji: 0, vocabulary: 0 }

  const typeData: TypeData[] = metrics
    ? [
        { type: 'Radicals', accuracy: metrics.byType.radicals, count: typeCounts.radicals },
        { type: 'Kanji', accuracy: metrics.byType.kanji, count: typeCounts.kanji },
        { type: 'Vocabulary', accuracy: metrics.byType.vocabulary, count: typeCounts.vocabulary },
      ]
    : []

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />

        {/* Type sections */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              {/* Label, accuracy, count row */}
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                <div className="flex items-center gap-4">
                  <div className="h-7 w-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return null
  }
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
        Accuracy by Type
      </h2>

      <div className="space-y-6">
        {typeData.map((item) => (
          <div key={item.type} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
                {item.type}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xl font-semibold text-ink-100 dark:text-paper-100">
                  {item.accuracy}%
                </span>
                <span className="text-sm text-ink-400 dark:text-paper-300 w-20 text-right">
                  {item.count.toLocaleString()}
                </span>
              </div>
            </div>
            <ProgressBar
              value={item.accuracy}
              color="bg-patina-500"
              height="md"
              animated
            />
          </div>
        ))}
      </div>
    </div>
  )
}
