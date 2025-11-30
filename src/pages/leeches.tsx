import { PriorityList } from '@/components/leeches/priority-list'
import { ConfusionPairs } from '@/components/leeches/confusion-pairs'
import { RootCauses } from '@/components/leeches/root-causes'
import { useReviewStatistics, useSubjects, useAssignments } from '@/lib/api/queries'
import { detectLeeches } from '@/lib/calculations/leeches'
import { useSyncStore } from '@/stores/sync-store'

export function Leeches() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || assignmentsLoading || isSyncing

  const leeches = reviewStats && subjects && assignments
    ? detectLeeches(reviewStats, subjects, assignments)
    : []

  // Calculate severity breakdown
  const highSeverity = leeches.filter(l => l.severity >= 75).length
  const moderateSeverity = leeches.filter(l => l.severity < 75).length

  return (
    <div className="space-y-8">
      {/* Leech Summary */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Leech Summary
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-2 mx-auto w-16" />
                <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mx-auto w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-vermillion-500 dark:text-vermillion-400 mb-2">
                {leeches.length}
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300">Total Leeches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-ochre dark:text-ochre mb-2">
                {highSeverity}
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300">High Severity</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-ink-400 dark:text-paper-300 mb-2">
                {moderateSeverity}
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300">Moderate Severity</div>
            </div>
          </div>
        )}
      </div>

      {/* Confusion Pairs and Root Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RootCauses />
        <ConfusionPairs />
      </div>

      {/* Priority List */}
      <PriorityList />
    </div>
  )
}
