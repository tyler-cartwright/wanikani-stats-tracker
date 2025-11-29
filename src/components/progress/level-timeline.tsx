import { differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { useUser, useLevelProgressions } from '@/lib/api/queries'

interface LevelData {
  level: number
  days: number | null // null for current level
  pace: 'fast' | 'average' | 'slow'
}

const paceColors = {
  fast: 'bg-patina-500 text-paper-100',
  average: 'bg-ink-400 text-paper-100',
  slow: 'bg-ochre text-paper-100',
}

function determinePace(days: number, average: number): 'fast' | 'average' | 'slow' {
  if (days < average * 0.75) return 'fast'
  if (days > average * 1.25) return 'slow'
  return 'average'
}

export function LevelTimeline() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: levelProgressions, isLoading: progressionsLoading } = useLevelProgressions()

  const isLoading = userLoading || progressionsLoading

  // Calculate level data from progressions
  const levelData: LevelData[] = []
  if (levelProgressions && user) {
    // First pass: calculate days for completed levels
    const completedLevels: Array<{ level: number; days: number }> = []

    for (const progression of levelProgressions) {
      if (progression.passed_at && progression.unlocked_at) {
        const unlockedDate = new Date(progression.unlocked_at)
        const passedDate = new Date(progression.passed_at)
        const days = differenceInDays(passedDate, unlockedDate)
        if (days >= 0) {
          completedLevels.push({ level: progression.level, days })
        }
      }
    }

    // Calculate average for pace determination
    const avgDays = completedLevels.length > 0
      ? completedLevels.reduce((sum, l) => sum + l.days, 0) / completedLevels.length
      : 12

    // Add completed levels with pace
    for (const { level, days } of completedLevels) {
      levelData.push({
        level,
        days,
        pace: determinePace(days, avgDays),
      })
    }

    // Add current level
    if (user.level > 0 && !completedLevels.some(l => l.level === user.level)) {
      levelData.push({
        level: user.level,
        days: null,
        pace: 'average',
      })
    }

    // Sort by level
    levelData.sort((a, b) => a.level - b.level)
  }

  const completedLevels = levelData.filter((l) => l.days !== null)
  const avgDays = completedLevels.length > 0
    ? completedLevels.reduce((sum, l) => sum + (l.days || 0), 0) / completedLevels.length
    : 0
  const fastestDays = completedLevels.length > 0
    ? Math.min(...completedLevels.map((l) => l.days || Infinity))
    : 0
  const slowestDays = completedLevels.length > 0
    ? Math.max(...completedLevels.map((l) => l.days || 0))
    : 0

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="flex gap-6 mb-8">
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (levelData.length === 0) {
    return null
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
        Level History
      </h2>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 mb-8 text-sm">
        <div>
          <span className="text-ink-400 dark:text-paper-300">Average:</span>{' '}
          <span className="text-ink-100 dark:text-paper-100 font-semibold">{Math.round(avgDays)} days</span>
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Fastest:</span>{' '}
          <span className="text-patina-500 font-semibold">{fastestDays} days</span>
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Slowest:</span>{' '}
          <span className="text-ochre font-semibold">{slowestDays} days</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-3">
        {levelData.map((level) => (
          <div
            key={level.level}
            className={cn(
              'aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium transition-smooth',
              'hover:scale-105 cursor-pointer',
              level.days === null
                ? 'bg-vermillion-500 text-paper-100 relative'
                : paceColors[level.pace]
            )}
          >
            <div className="font-semibold">{level.level}</div>
            {level.days !== null ? (
              <div className="opacity-80">{level.days}d</div>
            ) : (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-paper-100 rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-patina-500 rounded-sm" />
          <span className="text-ink-400 dark:text-paper-300">Fast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-ink-400 dark:bg-paper-400 rounded-sm" />
          <span className="text-ink-400 dark:text-paper-300">Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-ochre rounded-sm" />
          <span className="text-ink-400 dark:text-paper-300">Slow</span>
        </div>
      </div>
    </div>
  )
}
