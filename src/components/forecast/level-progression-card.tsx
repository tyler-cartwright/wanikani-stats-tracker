import { TrendingUp, PartyPopper } from 'lucide-react'
import type { LevelProgressionForecastResult } from '@/lib/calculations/level-progression-forecast'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import { cn } from '@/lib/utils/cn'

interface LevelProgressionCardProps {
  result: LevelProgressionForecastResult | null
  isLoading: boolean
  forecastDays: number
  className?: string
}

export function LevelProgressionCard({ result, isLoading, forecastDays, className }: LevelProgressionCardProps) {
  if (isLoading) {
    return (
      <div className={cn("bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm", className)}>
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
        <div className="h-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
      </div>
    )
  }

  if (!result) return null

  // Check edge cases
  const isAtMaxLevel = result.startingLevel === 60
  const noLevelsGained = result.levelsGained === 0 && result.progressInFinalLevel === 0

  return (
    <div className={cn("bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Level Progression
        </h2>
        <InfoTooltip content="Predicts what WaniKani level you'll reach during the forecast period based on your lesson pace. Counts remaining lessons from your current level onward. You can control whether vocabulary is included in Settings → Forecast (you don't need vocabulary to level up, only 90% of kanji at Guru). Starts from your actual progress in your current level." />
      </div>

      {/* Content */}
      {isAtMaxLevel ? (
        <div className="text-center py-6">
          <PartyPopper className="w-12 h-12 mx-auto mb-3 text-patina-500" />
          <p className="text-lg font-semibold text-ink-100 dark:text-paper-100 mb-1">
            Already at Level 60!
          </p>
          <p className="text-sm text-ink-400 dark:text-paper-300">
            You've reached the maximum level
          </p>
        </div>
      ) : noLevelsGained ? (
        <div className="text-center py-6">
          <p className="text-lg font-semibold text-ink-100 dark:text-paper-100 mb-1">
            Not enough lessons
          </p>
          <p className="text-sm text-ink-400 dark:text-paper-300">
            Increase lesson pace or forecast period to see level progression
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Level visualization */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-sm text-ink-400 dark:text-paper-300 mb-1">Current</div>
              <div className="w-16 h-16 rounded-full bg-paper-300 dark:bg-ink-300 flex items-center justify-center">
                <span className="text-2xl font-display font-bold text-ink-100 dark:text-paper-100">
                  {result.startingLevel}
                </span>
              </div>
            </div>

            <TrendingUp className="w-8 h-8 text-patina-500" />

            <div className="text-center">
              <div className="text-sm text-ink-400 dark:text-paper-300 mb-1">
                {result.completedWaniKani ? 'Completed!' : 'Projected'}
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                result.completedWaniKani
                  ? 'bg-patina-500 dark:bg-patina-400'
                  : 'bg-vermillion-500 dark:bg-vermillion-400'
              }`}>
                <span className="text-2xl font-display font-bold text-white">
                  {result.projectedLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar for partial level completion */}
          {result.progressInFinalLevel < 100 && result.progressInFinalLevel > 0 && (
            <div>
              <div className="flex justify-between text-xs text-ink-400 dark:text-paper-300 mb-1">
                <span>Progress in Level {result.projectedLevel}</span>
                <span>{result.progressInFinalLevel}%</span>
              </div>
              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-patina-500 dark:bg-patina-400 rounded-full transition-all duration-slow"
                  style={{ width: `${result.progressInFinalLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-paper-300 dark:border-ink-300">
            <div>
              <p className="text-xs text-ink-400 dark:text-paper-300 mb-1">Levels Gained</p>
              <p className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                {result.completedWaniKani ? (
                  <span className="flex items-center gap-1">
                    <PartyPopper className="w-4 h-4" />
                    {result.levelsGained}
                  </span>
                ) : (
                  `+${result.levelsGained}`
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400 dark:text-paper-300 mb-1">Lessons Completed</p>
              <p className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                {result.lessonsCompleted}
              </p>
            </div>
          </div>

          {/* Celebration message for completing WaniKani */}
          {result.completedWaniKani && (
            <div className="mt-4 p-3 bg-patina-500/10 border border-patina-500 rounded-lg">
              <p className="text-sm font-semibold text-patina-600 dark:text-patina-500 text-center">
                You'll complete WaniKani in {forecastDays} days! 🎉
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
