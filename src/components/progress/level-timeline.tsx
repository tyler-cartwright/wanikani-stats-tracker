import { differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { useUser, useLevelProgressions } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { calculateActiveAverage } from '@/lib/calculations/activity-analysis'

interface LevelData {
  level: number
  days: number | null // null for current level
  pace: 'fast' | 'good' | 'slow' | 'very-slow'
}

// Calculate standard deviation
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

// Determine pace using statistical approach (standard deviation)
function determinePace(
  days: number,
  mean: number,
  stdDev: number
): 'fast' | 'good' | 'slow' | 'very-slow' {
  if (days < mean - 0.5 * stdDev) return 'fast'
  if (days > mean + 1.5 * stdDev) return 'very-slow'
  if (days > mean + 0.5 * stdDev) return 'slow'
  return 'good'
}

export function LevelTimeline() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: levelProgressions, isLoading: progressionsLoading } = useLevelProgressions()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const useActiveAverage = useSettingsStore((state) => state.useActiveAverage)
  const averagingMethod = useSettingsStore((state) => state.averagingMethod)
  const useCustomThreshold = useSettingsStore((state) => state.useCustomThreshold)
  const customThresholdDays = useSettingsStore((state) => state.customThresholdDays)

  const isLoading = userLoading || progressionsLoading || isSyncing

  // Calculate level data from progressions
  const levelData: LevelData[] = []
  let avgDays = 0
  let stdDev = 0
  let fastestDays = 0
  let slowestDays = 0

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

    // Calculate average for pace determination using settings
    if (useActiveAverage && completedLevels.length > 0) {
      // Use active average with settings
      const activeResult = calculateActiveAverage(
        levelProgressions,
        {
          absoluteThreshold: customThresholdDays,
          useCustomThreshold: useCustomThreshold,
        },
        averagingMethod
      )
      avgDays = activeResult.activeAverage
    } else {
      // Use simple average
      avgDays = completedLevels.length > 0
        ? completedLevels.reduce((sum, l) => sum + l.days, 0) / completedLevels.length
        : 12
    }

    // Calculate standard deviation
    const daysArray = completedLevels.map(l => l.days)
    stdDev = calculateStdDev(daysArray, avgDays)

    // Add completed levels with pace
    for (const { level, days } of completedLevels) {
      levelData.push({
        level,
        days,
        pace: determinePace(days, avgDays, stdDev),
      })
    }

    // Add current level
    if (user.level > 0 && !completedLevels.some(l => l.level === user.level)) {
      levelData.push({
        level: user.level,
        days: null,
        pace: 'good',
      })
    }

    // Sort by level
    levelData.sort((a, b) => a.level - b.level)

    // Calculate stats for display
    const displayLevels = levelData.filter((l) => l.days !== null)
    fastestDays = displayLevels.length > 0
      ? Math.min(...displayLevels.map((l) => l.days || Infinity))
      : 0
    slowestDays = displayLevels.length > 0
      ? Math.max(...displayLevels.map((l) => l.days || 0))
      : 0
  }

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />

        {/* Stats row */}
        <div className="flex gap-6 mb-8">
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
        </div>

        {/* Vertical bar placeholders */}
        <div className="h-[400px] flex items-end gap-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full bg-paper-300 dark:bg-ink-300 rounded-t-md animate-pulse"
                style={{ height: `${Math.random() * 300 + 50}px` }}
              />
              <div className="w-6 h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
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
          {useActiveAverage && (
            <span className="text-xs text-ink-400 dark:text-paper-300 ml-1">
              ({averagingMethod === 'median' ? 'median' : 'trimmed'})
            </span>
          )}
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Fastest:</span>{' '}
          <span className="text-patina-600 dark:text-patina-500 font-semibold">{fastestDays} days</span>
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Slowest:</span>{' '}
          <span className="text-vermillion-500 dark:text-vermillion-400 font-semibold">{slowestDays} days</span>
        </div>
      </div>

      {/* Vertical bar chart */}
      <div className="relative">
        {/* Calculate max days for scaling */}
        {(() => {
          const maxDays = Math.max(...levelData.filter(l => l.days !== null).map(l => l.days || 0))
          const containerHeight = 400 // Fixed container height in pixels

          return (
            <>
              {/* Chart container with fixed height */}
              <div className="relative overflow-x-auto pb-2">
                <div className="flex items-end gap-1 min-w-full" style={{ height: `${containerHeight}px` }}>
                  {levelData.map((level) => {
                    const barHeight = level.days !== null
                      ? (level.days / maxDays) * (containerHeight - 40) // Reserve 40px for labels
                      : 0

                    // Smart tooltip positioning - show below bar if it's too tall
                    const isTallBar = barHeight > (containerHeight - 80)

                    return (
                      <div
                        key={level.level}
                        className="flex-1 flex flex-col items-center justify-end group min-w-[8px]"
                      >
                        {/* Bar */}
                        <div className="relative w-full flex flex-col items-center">
                          {level.days !== null ? (
                            <>
                              {/* Days label on hover/tap - smart positioning */}
                              <div className={cn(
                                'absolute opacity-0 group-hover:opacity-100 transition-opacity bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs px-2 py-1 rounded whitespace-nowrap z-10',
                                isTallBar ? 'top-2' : '-top-6'
                              )}>
                                {level.days}d
                              </div>

                              {/* Vertical bar */}
                              <div
                                className={cn(
                                  'w-full rounded-t-md transition-all duration-slow ease-out group-hover:opacity-80',
                                  level.pace === 'fast' && 'bg-patina-600 dark:bg-patina-500',
                                  level.pace === 'good' && 'bg-patina-500 dark:bg-patina-400',
                                  level.pace === 'slow' && 'bg-ochre',
                                  level.pace === 'very-slow' && 'bg-vermillion-500 dark:bg-vermillion-400'
                                )}
                                style={{ height: `${barHeight}px` }}
                              />
                            </>
                          ) : (
                            // Current level indicator
                            <div className="flex flex-col items-center mb-2">
                              <div className="w-2 h-2 bg-vermillion-500 rounded-full animate-pulse mb-1" />
                            </div>
                          )}
                        </div>

                        {/* Level number below bar */}
                        <div className={cn(
                          'text-xs font-medium mt-2 tabular-nums',
                          level.days === null
                            ? 'text-vermillion-500 font-semibold'
                            : 'text-ink-400 dark:text-paper-300'
                        )}>
                          {level.level}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Y-axis indicator */}
              <div className="text-xs text-ink-400 dark:text-paper-300 mt-2 text-right">
                Max: {maxDays} days
              </div>
            </>
          )
        })()}
      </div>

      {/* Legend - Traffic light system */}
      <div className="flex flex-wrap gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-patina-600 dark:bg-patina-500 rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Fast (&lt; avg - 0.5σ)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-patina-500 dark:bg-patina-400 rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Good (within ±0.5σ)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-ochre rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Slow (avg + 0.5σ to 1.5σ)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-vermillion-500 dark:bg-vermillion-400 rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Very Slow (&gt; avg + 1.5σ)</span>
        </div>
      </div>
    </div>
  )
}
