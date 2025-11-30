import { useReviewStatistics, useSubjects, useAssignments } from '@/lib/api/queries'
import { detectLeeches, findRootCauseRadicals } from '@/lib/calculations/leeches'
import { useSyncStore } from '@/stores/sync-store'

interface DisplayRootCause {
  radical: string
  name: string
  affectedCount: number
  affectedItems: string[]
}

export function RootCauses() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || assignmentsLoading || isSyncing

  const leeches = reviewStats && subjects && assignments
    ? detectLeeches(reviewStats, subjects, assignments)
    : []

  const rootCauses = leeches.length > 0 && subjects
    ? findRootCauseRadicals(leeches, subjects)
    : []

  const displayRootCauses: DisplayRootCause[] = rootCauses.slice(0, 5).map(cause => ({
    radical: cause.radical,
    name: cause.name,
    affectedCount: cause.affectedCount,
    affectedItems: cause.affectedItems.slice(0, 8).map(item => item.character),
  }))

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
        <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6 w-3/4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
        Root Cause Radicals
      </h2>
      <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">
        These components are causing problems in multiple items. Study these first!
      </p>

      {displayRootCauses.length === 0 ? (
        <div className="text-center py-8 text-ink-400 dark:text-paper-300">
          <p className="text-sm">No root cause radicals detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayRootCauses.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="text-4xl font-japanese text-ink-100 dark:text-paper-100">
                  {item.radical}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-ink-100 dark:text-paper-100">
                    {item.name}
                  </div>
                  <div className="text-sm text-vermillion-500 dark:text-vermillion-400 font-semibold">
                    Affecting {item.affectedCount} leech items
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.affectedItems.map((char, charIdx) => (
                  <span
                    key={charIdx}
                    className="inline-flex items-center justify-center w-10 h-10 bg-paper-100 dark:bg-ink-100 rounded-md text-lg font-japanese text-ink-100 dark:text-paper-100 hover:bg-vermillion-500/10 dark:hover:bg-vermillion-500/20 transition-smooth cursor-pointer"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
