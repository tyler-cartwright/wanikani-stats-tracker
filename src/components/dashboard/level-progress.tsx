import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LayeredProgressBar } from '@/components/shared/layered-progress-bar'
import { useUser, useAssignments, useSubjects, useLevelProgressions } from '@/lib/api/queries'
import { calculateLevelProgress } from '@/lib/calculations/level-progress'
import { useSyncStore } from '@/stores/sync-store'
import { cn } from '@/lib/utils/cn'

export function LevelProgress() {
  const { data: user } = useUser()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: levelProgressions } = useLevelProgressions()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const [selectedLevel, setSelectedLevel] = useState(1)

  // Update selected level when user data loads
  useEffect(() => {
    if (user?.level) {
      setSelectedLevel(user.level)
    }
  }, [user?.level])

  const isLoading = assignmentsLoading || subjectsLoading || isSyncing

  // Get progression data for selected level
  // For reset levels, prefer the progression with passed_at (completed) over abandoned ones
  const selectedLevelProgression = levelProgressions
    ?.filter((lp) => lp.level === selectedLevel)
    .sort((a, b) => {
      // Prioritize passed levels
      if (a.passed_at && !b.passed_at) return -1
      if (!a.passed_at && b.passed_at) return 1
      // Otherwise use most recent created_at
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })[0]

  // Calculate level progress
  const progress =
    user && assignments && subjects
      ? calculateLevelProgress(
          assignments,
          subjects,
          selectedLevel,
          user.level,
          selectedLevelProgression?.unlocked_at ?? undefined,
          selectedLevelProgression?.passed_at ?? undefined
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedLevel((prev) => prev - 1)}
            disabled={selectedLevel <= 1}
            className={cn(
              'p-1.5 rounded-md transition-smooth focus-ring',
              selectedLevel <= 1
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-paper-300 dark:hover:bg-ink-300'
            )}
            aria-label="Previous level"
          >
            <ChevronLeft className="w-5 h-5 text-ink-400 dark:text-paper-300" />
          </button>
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
            Level {selectedLevel} Progress
          </h2>
          <button
            onClick={() => setSelectedLevel((prev) => prev + 1)}
            disabled={!user || selectedLevel >= user.level}
            className={cn(
              'p-1.5 rounded-md transition-smooth focus-ring',
              !user || selectedLevel >= user.level
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-paper-300 dark:hover:bg-ink-300'
            )}
            aria-label="Next level"
          >
            <ChevronRight className="w-5 h-5 text-ink-400 dark:text-paper-300" />
          </button>
        </div>
        <span className="text-sm text-ink-400 dark:text-paper-300 font-medium">
          Day {progress.daysOnLevel}
        </span>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.type} className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-0">
              <span className="text-ink-400 dark:text-paper-300 font-medium">{item.type}</span>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-ink-400 dark:text-paper-400 tabular-nums text-xs">
                  {item.data.started}/{item.data.total} started
                </span>
                <span className="text-ink-300 dark:text-paper-300 tabular-nums">
                  {item.data.guru}/{item.data.total} guru
                </span>
                <span className="text-ink-100 dark:text-paper-100 font-semibold w-12 text-right tabular-nums">
                  {item.data.guruPercentage}%
                </span>
              </div>
            </div>
            <LayeredProgressBar
              backgroundValue={item.data.startedPercentage}
              foregroundValue={item.data.guruPercentage}
              height="md"
              animated
            />
          </div>
        ))}

        <div className="pt-6 border-t border-paper-300 dark:border-ink-300">
          {progress.isCurrentLevel ? (
            <p className="text-sm text-ink-400 dark:text-paper-300">
              {progress.kanjiNeededToLevelUp === 0
                ? 'Ready to level up!'
                : `${progress.kanjiNeededToLevelUp} kanji to level up`}
            </p>
          ) : progress.passedAt && selectedLevelProgression?.passed_at ? (
            <p className="text-sm text-ink-400 dark:text-paper-300">
              Passed {format(new Date(progress.passedAt), 'MMM d, yyyy')}
              {progress.daysOnLevel > 0 && <span> · {progress.daysOnLevel} days</span>}
            </p>
          ) : selectedLevelProgression?.unlocked_at ? (
            <p className="text-sm text-ink-400 dark:text-paper-300">In progress</p>
          ) : (
            <p className="text-sm text-ink-400 dark:text-paper-300">Not started</p>
          )}
        </div>
      </div>
    </div>
  )
}
