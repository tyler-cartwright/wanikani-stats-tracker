import { ProgressBar } from '@/components/shared/progress-bar'
import { useUser, useAssignments, useSubjects, useLevelProgressions } from '@/lib/api/queries'
import { calculateLevelProgress } from '@/lib/calculations/level-progress'
import { useSyncStore } from '@/stores/sync-store'

export function LevelProgress() {
  const { data: user } = useUser()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: levelProgressions } = useLevelProgressions()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = assignmentsLoading || subjectsLoading || isSyncing

  // Calculate level progress
  const progress = user && assignments && subjects
    ? calculateLevelProgress(
        assignments,
        subjects,
        user.level,
        levelProgressions?.find((lp) => lp.level === user.level)?.unlocked_at ?? undefined
      )
    : null

  if (isLoading || !progress) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const items = [
    { type: 'Radicals', data: progress.radicals },
    { type: 'Kanji', data: progress.kanji },
    { type: 'Vocabulary', data: progress.vocabulary },
  ]

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Level {user?.level} Progress
        </h2>
        <span className="text-sm text-ink-400 dark:text-paper-300 font-medium">
          Day {progress.daysOnLevel}
        </span>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.type} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400 dark:text-paper-300 font-medium">{item.type}</span>
              <div className="flex items-center gap-4">
                <span className="text-ink-300 dark:text-paper-400 tabular-nums">
                  {item.data.current}/{item.data.total}
                </span>
                <span className="text-ink-100 dark:text-paper-100 font-semibold w-12 text-right tabular-nums">
                  {item.data.percentage}%
                </span>
              </div>
            </div>
            <ProgressBar
              value={item.data.percentage}
              color="bg-patina-500"
              height="md"
              animated
            />
          </div>
        ))}

        <div className="pt-6 border-t border-paper-300 dark:border-ink-300">
          <p className="text-sm text-ink-400 dark:text-paper-300">
            {progress.kanjiNeededToLevelUp === 0
              ? 'Ready to level up!'
              : `${progress.kanjiNeededToLevelUp} kanji to level up`}
          </p>
        </div>
      </div>
    </div>
  )
}
