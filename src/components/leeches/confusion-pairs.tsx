import { Zap } from 'lucide-react'
import { useReviewStatistics, useSubjects, useAssignments } from '@/lib/api/queries'
import { detectLeeches, findConfusionPairs } from '@/lib/calculations/leeches'
import { useSyncStore } from '@/stores/sync-store'

interface DisplayPair {
  item1: { character: string; meaning: string; accuracy: number }
  item2: { character: string; meaning: string; accuracy: number }
}

export function ConfusionPairs() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || assignmentsLoading || isSyncing

  const leeches = reviewStats && subjects && assignments
    ? detectLeeches(reviewStats, subjects, assignments)
    : []

  const confusionPairs = leeches.length > 0
    ? findConfusionPairs(leeches)
    : []

  const displayPairs: DisplayPair[] = confusionPairs.slice(0, 5).map(pair => ({
    item1: {
      character: pair.item1.character,
      meaning: pair.item1.meaning,
      accuracy: pair.item1.accuracy,
    },
    item2: {
      character: pair.item2.character,
      meaning: pair.item2.meaning,
      accuracy: pair.item2.accuracy,
    },
  }))

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
        <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6 w-2/3" />
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
        Confusion Pairs
      </h2>
      <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">
        These similar items are both giving you trouble.
      </p>

      {displayPairs.length === 0 ? (
        <div className="text-center py-8 text-ink-400 dark:text-paper-300">
          <p className="text-sm">No confusion pairs detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPairs.map((pair, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr,auto,1fr] gap-4 p-4 rounded-lg border border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer"
            >
              {/* Item 1 */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-japanese text-ink-100 dark:text-paper-100">
                  {pair.item1.character}
                </div>
                <div className="text-sm text-ink-300 dark:text-paper-300">{pair.item1.meaning}</div>
                <div className="text-xs text-vermillion-500 dark:text-vermillion-400 font-semibold">
                  {pair.item1.accuracy}%
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-vermillion-500/20 dark:bg-vermillion-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-vermillion-500 dark:text-vermillion-400" />
                </div>
              </div>

              {/* Item 2 */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-japanese text-ink-100 dark:text-paper-100">
                  {pair.item2.character}
                </div>
                <div className="text-sm text-ink-300 dark:text-paper-300">{pair.item2.meaning}</div>
                <div className="text-xs text-vermillion-500 dark:text-vermillion-400 font-semibold">
                  {pair.item2.accuracy}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
