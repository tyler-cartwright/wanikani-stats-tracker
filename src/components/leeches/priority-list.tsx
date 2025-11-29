import { useReviewStatistics, useSubjects, useAssignments } from '@/lib/api/queries'
import { detectLeeches } from '@/lib/calculations/leeches'

interface DisplayLeechItem {
  rank: number
  character: string
  meaning: string
  accuracy: number
  reviews: number
  severity: number
  focus: string
}

export function PriorityList() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()

  const isLoading = statsLoading || subjectsLoading || assignmentsLoading

  const leeches = reviewStats && subjects && assignments
    ? detectLeeches(reviewStats, subjects, assignments)
    : []

  // Determine focus based on accuracy difference
  const displayLeeches: DisplayLeechItem[] = leeches.slice(0, 10).map((leech, idx) => {
    const meaningDiff = 100 - leech.meaningAccuracy
    const readingDiff = 100 - leech.readingAccuracy
    const focus = meaningDiff > readingDiff ? 'Meaning' : 'Reading'

    return {
      rank: idx + 1,
      character: leech.character,
      meaning: leech.meaning,
      accuracy: leech.accuracy,
      reviews: leech.totalReviews,
      severity: leech.severity,
      focus,
    }
  })

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Priority Study List
        </h2>
        <span className="text-sm text-vermillion-500 dark:text-vermillion-400 font-semibold">
          {leeches.length} leeches
        </span>
      </div>

      {displayLeeches.length === 0 ? (
        <div className="text-center py-12 text-ink-400 dark:text-paper-300">
          <p className="text-lg font-medium mb-2">No leeches detected!</p>
          <p className="text-sm">You're doing great. Keep up the excellent work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayLeeches.map((item) => (
            <div
              key={item.rank}
              className="p-4 rounded-lg border border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vermillion-500 dark:bg-vermillion-400 text-paper-100 dark:text-ink-100 flex items-center justify-center text-sm font-semibold">
                  {item.rank}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Character and Meaning */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-japanese text-ink-100 dark:text-paper-100">
                      {item.character}
                    </span>
                    <span className="text-base text-ink-300 dark:text-paper-300">{item.meaning}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-ink-400 dark:text-paper-300">
                    <span>
                      Accuracy:{' '}
                      <span className="text-vermillion-500 dark:text-vermillion-400 font-semibold">
                        {item.accuracy}%
                      </span>
                    </span>
                    <span>Reviews: {item.reviews}</span>
                    <span>Severity: {item.severity}</span>
                  </div>

                  {/* Focus */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded-md bg-paper-100 dark:bg-ink-100 text-ink-400 dark:text-paper-300 font-medium">
                      Focus: {item.focus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
