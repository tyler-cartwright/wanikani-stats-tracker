import { ProgressBar } from '@/components/shared/progress-bar'
import { Lightbulb } from 'lucide-react'
import { useReviewStatistics, useSubjects } from '@/lib/api/queries'
import { calculateAccuracyMetrics } from '@/lib/calculations/accuracy'
import { useSyncStore } from '@/stores/sync-store'

export function AccuracyOverview() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || isSyncing

  const metrics = reviewStats && subjects
    ? calculateAccuracyMetrics(reviewStats, subjects)
    : null

  const overallAccuracy = metrics?.overall || 0
  const meaningAccuracy = metrics?.meaning || 0
  const readingAccuracy = metrics?.reading || 0
  const totalReviews = metrics?.totalReviews || 0

  // Calculate insight
  const accuracyDiff = meaningAccuracy - readingAccuracy
  const showInsight = Math.abs(accuracyDiff) >= 5

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex items-center justify-center">
            <div className="w-48 h-48 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col justify-center space-y-6">
            <div className="h-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            <div className="h-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-8">
        Overall Accuracy
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Circular Progress */}
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-paper-300 dark:text-ink-300"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallAccuracy / 100) * 553} 553`}
                className="text-vermillion-500 transition-smooth"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-display font-semibold text-ink-100 dark:text-paper-100">
                {overallAccuracy}%
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300 mt-1">Overall</div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink-400 dark:text-paper-300">Meaning</span>
              <span className="text-xl font-semibold text-ink-100 dark:text-paper-100">
                {meaningAccuracy}%
              </span>
            </div>
            <ProgressBar
              value={meaningAccuracy}
              color="bg-patina-500"
              height="md"
              animated
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink-400 dark:text-paper-300">Reading</span>
              <span className="text-xl font-semibold text-ink-100 dark:text-paper-100">
                {readingAccuracy}%
              </span>
            </div>
            <ProgressBar
              value={readingAccuracy}
              color="bg-vermillion-500"
              height="md"
              animated
            />
          </div>

          <div className="text-sm text-ink-400 dark:text-paper-300 pt-2">
            {totalReviews.toLocaleString()} total reviews
          </div>
        </div>
      </div>

      {/* Insight */}
      {showInsight && (
        <div className="mt-8 p-4 bg-vermillion-500/10 dark:bg-vermillion-500/20 border border-vermillion-500/20 dark:border-vermillion-500/30 rounded-lg">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-vermillion-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-ink-100 dark:text-paper-100">
              {accuracyDiff > 0 ? (
                <>
                  Your reading accuracy is {Math.abs(accuracyDiff)}% lower than meaning. Consider focusing on
                  reading practice.
                </>
              ) : (
                <>
                  Your meaning accuracy is {Math.abs(accuracyDiff)}% lower than reading. Consider focusing on
                  meaning practice.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
