import { useReviewStatistics, useSubjects, useAssignments } from '@/lib/api/queries'
import { detectLeeches } from '@/lib/calculations/leeches'
import { useSyncStore } from '@/stores/sync-store'

export function LeechAlert() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || assignmentsLoading || isSyncing

  const leeches =
    reviewStats && subjects && assignments
      ? detectLeeches(reviewStats, subjects, assignments)
      : []

  const leechCount = leeches.length

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6 w-3/4" />
        <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
      </div>
    )
  }

  if (leechCount === 0) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
          Leech Alert
        </h2>
        <p className="text-sm text-ink-400 dark:text-paper-300 mb-6 leading-relaxed">
          Great job! You have <span className="text-emerald-500 font-semibold">no leeches</span> at the
          moment.
        </p>
        <p className="text-xs text-ink-500 dark:text-paper-400">
          Keep up the good work with your reviews!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
        Leech Alert
      </h2>
      <p className="text-sm text-ink-400 dark:text-paper-300 mb-6 leading-relaxed">
        You have <span className="text-vermillion-500 font-semibold">{leechCount} leech{leechCount !== 1 ? 'es' : ''}</span> that
        need attention.
      </p>
      <a
        href="/leeches"
        className="inline-block text-sm font-medium text-vermillion-500 hover:text-vermillion-600 transition-smooth"
      >
        View problem items →
      </a>
    </div>
  )
}
