import { cn } from '@/lib/utils/cn'
import { useUser, useLevelProgressions } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { analyzeUnifiedLevelData } from '@/lib/calculations/activity-analysis'
import { formatDurationCompact } from '@/lib/calculations/level-progress'
import { InfoTooltip } from '@/components/shared/info-tooltip'

interface LevelData {
  level: number
  days: number | null // null for current level
  durationFormatted: string | null // formatted duration with hours for historical levels
  pace: 'fast' | 'good' | 'slow' | 'very-slow' | 'break'
}

// Bar Chart View with capped linear scale
function BarChartView({ levelData, capDays }: { levelData: LevelData[]; capDays: number }) {
  const containerHeight = 400
  const maxBarHeight = containerHeight - 40

  return (
    <>
      {/* Chart container with fixed height */}
      <div className="relative overflow-x-auto pb-2">
        <div className="flex items-end gap-1 min-w-full" style={{ height: `${containerHeight}px` }}>
          {levelData.map((level) => {
            // Linear scale capped at capDays
            const isCapped = level.days !== null && level.days > capDays
            const effectiveDays = isCapped ? capDays : (level.days ?? 0)
            const barHeight = level.days !== null ? (effectiveDays / capDays) * maxBarHeight : 0

            // Smart tooltip positioning - show below bar if it's too tall
            const isTallBar = barHeight > containerHeight - 80

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
                      <div
                        className={cn(
                          'absolute opacity-0 group-hover:opacity-100 transition-opacity bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs px-2 py-1 rounded whitespace-nowrap z-10',
                          isTallBar ? 'top-2' : '-top-6'
                        )}
                      >
                        {level.durationFormatted}
                        {isCapped && ' (capped)'}
                      </div>

                      {/* Vertical bar */}
                      <div
                        className={cn(
                          'w-full transition-all duration-slow ease-out group-hover:opacity-80 relative',
                          level.pace === 'fast' && 'bg-srs-guru',
                          level.pace === 'good' && 'bg-patina-500 dark:bg-patina-400',
                          level.pace === 'slow' && 'bg-ochre',
                          level.pace === 'very-slow' && 'bg-vermillion-500 dark:bg-vermillion-400',
                          level.pace === 'break' && 'bg-ink-400 dark:bg-paper-400',
                          isCapped ? 'rounded-t-sm' : 'rounded-t-md'
                        )}
                        style={{ height: `${barHeight}px` }}
                      >
                        {/* Capped indicator - gradient fade at top */}
                        {isCapped && (
                          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/40 dark:from-black/40 to-transparent rounded-t-sm" />
                        )}
                      </div>
                    </>
                  ) : (
                    // Current level indicator
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-2 h-2 bg-vermillion-500 rounded-full animate-pulse mb-1" />
                    </div>
                  )}
                </div>

                {/* Level number below bar */}
                <div
                  className={cn(
                    'text-xs font-medium mt-2 tabular-nums',
                    level.days === null
                      ? 'text-vermillion-500 font-semibold'
                      : 'text-ink-400 dark:text-paper-300'
                  )}
                >
                  {level.level}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Y-axis indicator */}
      <div className="text-xs text-ink-400 dark:text-paper-300 mt-2 text-right">
        Max: {capDays} days (normal range) · Outliers capped
      </div>
    </>
  )
}

// Cards Grid View
function CardsView({ levelData }: { levelData: LevelData[] }) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
      {levelData.map((level) => (
        <div
          key={level.level}
          className={cn(
            'rounded-lg p-2 text-center border bg-paper-100 dark:bg-ink-100 transition-smooth hover:scale-105',
            level.days === null &&
              'border-vermillion-500',
            level.days !== null && level.pace === 'fast' &&
              'border-srs-guru',
            level.days !== null && level.pace === 'good' &&
              'border-patina-500 dark:border-patina-400',
            level.days !== null && level.pace === 'slow' &&
              'border-ochre',
            level.days !== null && level.pace === 'very-slow' &&
              'border-vermillion-500 dark:border-vermillion-400',
            level.days !== null && level.pace === 'break' &&
              'border-ink-400 dark:border-paper-400'
          )}
        >
          <div className="text-xs font-semibold text-ink-100 dark:text-paper-100">
            {level.level}
          </div>
          <div
            className={cn(
              'text-sm font-bold tabular-nums',
              level.days === null && 'text-vermillion-500',
              level.days !== null && level.pace === 'fast' && 'text-srs-guru',
              level.days !== null && level.pace === 'good' && 'text-patina-600 dark:text-patina-500',
              level.days !== null && level.pace === 'slow' && 'text-ochre',
              level.days !== null && level.pace === 'very-slow' && 'text-vermillion-600 dark:text-vermillion-400',
              level.days !== null && level.pace === 'break' && 'text-ink-400 dark:text-paper-400'
            )}
          >
            {level.durationFormatted ?? '...'}
          </div>
        </div>
      ))}
    </div>
  )
}

// Compact List View
function CompactListView({ levelData }: { levelData: LevelData[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {levelData.map((level) => (
        <div
          key={level.level}
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium tabular-nums transition-smooth hover:scale-105',
            level.days === null &&
              'bg-vermillion-500 text-white',
            level.days !== null && level.pace === 'fast' &&
              'bg-srs-guru text-white',
            level.days !== null && level.pace === 'good' &&
              'bg-patina-500 text-white dark:bg-patina-400',
            level.days !== null && level.pace === 'slow' &&
              'bg-ochre text-ink-100 dark:text-ink-100',
            level.days !== null && level.pace === 'very-slow' &&
              'bg-vermillion-500 text-white dark:bg-vermillion-400',
            level.days !== null && level.pace === 'break' &&
              'bg-ink-400 text-white dark:bg-paper-400 dark:text-ink-100'
          )}
        >
          {level.level}: {level.durationFormatted ?? '...'}
        </div>
      ))}
    </div>
  )
}

export function LevelTimeline() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: levelProgressions, isLoading: progressionsLoading } = useLevelProgressions()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const levelHistoryMode = useSettingsStore((state) => state.levelHistoryMode)

  const isLoading = userLoading || progressionsLoading || isSyncing

  // Calculate level data from progressions using unified MAD analysis
  const levelData: LevelData[] = []
  let avgDays = 0
  let fastestDays = 0
  let slowestDays = 0
  let includedCount = 0
  let outlierThreshold = 0
  let excludedCount = 0

  if (levelProgressions && user) {
    // Use unified MAD analysis
    const analysis = analyzeUnifiedLevelData(levelProgressions)
    avgDays = analysis.average
    outlierThreshold = analysis.outlierThreshold
    excludedCount = analysis.excludedLevels.length

    // Add all completed levels with pace
    for (const included of analysis.includedLevels) {
      levelData.push({
        level: included.level,
        days: included.days,
        durationFormatted: formatDurationCompact(included.milliseconds),
        pace: included.pace,
      })
    }

    // Add excluded levels as breaks
    for (const excluded of analysis.excludedLevels) {
      // Find the milliseconds for this level
      const progression = levelProgressions.find(p => p.level === excluded.level)
      let milliseconds = 0
      if (progression?.passed_at && progression?.unlocked_at) {
        const unlockedDate = new Date(progression.unlocked_at)
        const passedDate = new Date(progression.passed_at)
        milliseconds = passedDate.getTime() - unlockedDate.getTime()
      }

      levelData.push({
        level: excluded.level,
        days: excluded.days,
        durationFormatted: formatDurationCompact(milliseconds),
        pace: 'break',
      })
    }

    // Add current level
    if (user.level > 0 && !levelData.some(l => l.level === user.level)) {
      levelData.push({
        level: user.level,
        days: null,
        durationFormatted: null,
        pace: 'good',
      })
    }

    // Sort by level
    levelData.sort((a, b) => a.level - b.level)

    // Calculate stats for display
    const displayLevels = levelData.filter((l) => l.days !== null)
    includedCount = analysis.includedLevels.length
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
        <div className="flex flex-wrap gap-4 sm:gap-6 mb-8">
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
        </div>

        {/* Vertical bar placeholders */}
        <div className="relative overflow-x-auto pb-2">
          <div className="h-[400px] flex items-end gap-1 min-w-full">
            {/* Mobile: fewer bars */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end md:hidden min-w-[8px]">
                <div
                  className="w-full bg-paper-300 dark:bg-ink-300 rounded-t-md animate-pulse"
                  style={{ height: `${Math.random() * 300 + 50}px` }}
                />
                <div className="w-6 h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mt-2" />
              </div>
            ))}
            {/* Desktop: more bars */}
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="hidden md:flex flex-1 flex-col items-center justify-end min-w-[8px]">
                <div
                  className="w-full bg-paper-300 dark:bg-ink-300 rounded-t-md animate-pulse"
                  style={{ height: `${Math.random() * 300 + 50}px` }}
                />
                <div className="w-6 h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
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
      <div className="flex flex-wrap gap-6 mb-6 text-sm">
        <div>
          <span className="text-ink-400 dark:text-paper-300">Average:</span>{' '}
          <span className="text-ink-100 dark:text-paper-100 font-semibold">{Math.round(avgDays)} days</span>
          {includedCount > 0 && (
            <span className="text-xs text-ink-400 dark:text-paper-300 ml-1">
              (of {includedCount} levels)
            </span>
          )}
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Fastest:</span>{' '}
          <span className="text-srs-guru font-semibold">{fastestDays} days</span>
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Slowest:</span>{' '}
          <span className="text-vermillion-500 dark:text-vermillion-400 font-semibold">{slowestDays} days</span>
        </div>
      </div>

      {/* Automatic break detection info - only show if there are excluded levels */}
      {excludedCount > 0 && (
        <div className="mb-8 p-3 bg-paper-300/50 dark:bg-ink-300/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-ink-100 dark:text-paper-100">
            <div className="w-3 h-3 bg-ink-400 dark:bg-paper-400 rounded-sm flex-shrink-0" />
            <span className="font-medium">
              {excludedCount} {excludedCount === 1 ? 'level' : 'levels'} auto-detected as {excludedCount === 1 ? 'a break' : 'breaks'}
            </span>
            <InfoTooltip content={`Levels longer than ${Math.round(outlierThreshold)} days are automatically detected as breaks using statistical analysis (MAD - Median Absolute Deviation). These are shown in gray and excluded from your average to give you a more accurate picture of your active learning pace.`} />
          </div>
        </div>
      )}

      {/* Visualization - conditional based on mode */}
      {(() => {
        // Calculate cap as maximum of included (non-break) levels
        // This ensures all colored bars fit naturally, only gray bars overflow
        const includedLevelDays = levelData
          .filter((l) => l.days !== null && l.pace !== 'break')
          .map((l) => l.days || 0)
        const capDays = includedLevelDays.length > 0
          ? Math.max(...includedLevelDays)
          : 30 // Fallback if no included levels

        return (
          <div className="relative">
            {levelHistoryMode === 'bar-chart' && <BarChartView levelData={levelData} capDays={capDays} />}
            {levelHistoryMode === 'cards' && <CardsView levelData={levelData} />}
            {levelHistoryMode === 'compact-list' && <CompactListView levelData={levelData} />}
          </div>
        )
      })()}

      {/* Legend - Pace indicators */}
      <div className="flex flex-wrap gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-srs-guru rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Fast - Much quicker than your average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-patina-500 dark:bg-patina-400 rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Good - Near your typical pace</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-ochre rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Slow - Taking longer than usual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-vermillion-500 dark:bg-vermillion-400 rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Very Slow - Significantly slower</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-ink-400 dark:bg-paper-400 rounded-full" />
          <span className="text-ink-400 dark:text-paper-300">Break - Auto-excluded from average</span>
        </div>
      </div>
    </div>
  )
}
