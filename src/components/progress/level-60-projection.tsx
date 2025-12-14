import { useState } from 'react'
import { format, formatDistanceToNow, addDays } from 'date-fns'
import { Rocket, TrendingUp, Turtle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUser, useLevelProgressions } from '@/lib/api/queries'
import { projectLevel60Date } from '@/lib/calculations/forecasting'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { Modal } from '@/components/shared/modal'

interface Scenario {
  icon: typeof Rocket
  label: string
  description: string
  date: Date
  pace: string
  color: string
}

export function Level60Projection() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: levelProgressions, isLoading: progressionsLoading } = useLevelProgressions()
  const [showExcludedLevels, setShowExcludedLevels] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<'fast' | 'expected' | 'conservative'>('expected')
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const useActiveAverage = useSettingsStore((state) => state.useActiveAverage)
  const averagingMethod = useSettingsStore((state) => state.averagingMethod)
  const useCustomThreshold = useSettingsStore((state) => state.useCustomThreshold)
  const customThresholdDays = useSettingsStore((state) => state.customThresholdDays)

  const isLoading = userLoading || progressionsLoading || isSyncing

  // Calculate projection with selected averaging method and threshold settings
  const projection = user && levelProgressions
    ? projectLevel60Date(
        user.level,
        levelProgressions,
        averagingMethod,
        useCustomThreshold,
        customThresholdDays
      )
    : null

  // Use setting to determine which average to use
  const primaryDate = projection ? (useActiveAverage ? projection.expectedActive : projection.expected) : null
  const primaryPace = projection ? (useActiveAverage ? projection.activeDaysPerLevel : projection.averageDaysPerLevel) : 0

  // Calculate conservative date based on selected pace
  const conservativeDate = user && projection
    ? addDays(new Date(), Math.round(primaryPace * 1.5 * (60 - user.level)))
    : null

  // Calculate pace based on selected scenario
  const selectedPace = projection
    ? selectedScenario === 'fast'
      ? 8
      : selectedScenario === 'conservative'
      ? Math.round(primaryPace * 1.5)
      : primaryPace
    : 0

  // Build comprehensive milestones (1, 10, 20, 30, 40, 50, 60)
  const allMilestones = user && levelProgressions && projection
    ? (() => {
        const milestoneLevels = [1, 10, 20, 30, 40, 50, 60]
        const now = new Date()

        return milestoneLevels.map((level) => {
          const isCompleted = user.level > level // Changed from >= to > (current level isn't complete yet)

          // For completed levels, try to get actual date
          let date: Date
          if (isCompleted) {
            if (level === 1) {
              // Level 1 start date - use unlocked_at
              const level1Progression = levelProgressions.find(p => p.level === 1)
              date = level1Progression?.unlocked_at ? new Date(level1Progression.unlocked_at) : now
            } else {
              // For other completed levels, use passed_at (when they leveled up FROM that level)
              const progression = levelProgressions.find(p => p.level === level)
              if (progression?.passed_at) {
                date = new Date(progression.passed_at)
              } else {
                // Fallback: try to infer from next level's unlocked_at
                const nextProgression = levelProgressions.find(p => p.level === level + 1)
                date = nextProgression?.unlocked_at ? new Date(nextProgression.unlocked_at) : now
              }
            }
          } else {
            // For upcoming levels, calculate projected date
            const levelsToGo = level - user.level
            date = addDays(now, levelsToGo * selectedPace)
          }

          return {
            level,
            date,
            status: isCompleted ? 'completed' as const : 'upcoming' as const
          }
        })
      })()
    : []

  // Mobile-optimized milestones: Start, Previous milestone, Next milestone, L60
  const mobileMilestones = allMilestones.length > 0 && user
    ? (() => {
        const majorMilestones = [10, 20, 30, 40, 50]
        const previousMilestone = majorMilestones
          .filter(level => user.level > level)
          .sort((a, b) => b - a)[0] // Get highest completed

        const nextMilestone = majorMilestones
          .filter(level => user.level < level)
          .sort((a, b) => a - b)[0] // Get lowest upcoming

        const selected = [1] // Always include start
        if (previousMilestone) selected.push(previousMilestone)
        if (nextMilestone) selected.push(nextMilestone)
        selected.push(60) // Always include level 60

        return allMilestones.filter(m => selected.includes(m.level))
      })()
    : []

  // Calculate completed levels count
  const completedLevels = levelProgressions
    ? levelProgressions.filter(p => p.passed_at && p.unlocked_at).length
    : 0

  // Build scenarios based on selected average
  const scenarios: Scenario[] = projection && primaryDate && conservativeDate
    ? [
        {
          icon: Rocket,
          label: 'Fast track',
          description: 'WaniKani speed run pace',
          date: projection.fastTrack,
          pace: '8 days/level',
          color: 'text-patina-600 dark:text-patina-500',
        },
        {
          icon: TrendingUp,
          label: 'Expected',
          description: useActiveAverage
            ? 'Based on active learning pace (excludes breaks)'
            : 'Based on all completed levels',
          date: primaryDate,
          pace: `${Math.round(primaryPace)} days/level`,
          color: 'text-ink-100 dark:text-paper-100',
        },
        {
          icon: Turtle,
          label: 'Conservative',
          description: '50% slower than your current pace',
          date: conservativeDate,
          pace: `${Math.round(primaryPace * 1.5)} days/level`,
          color: 'text-ink-400 dark:text-paper-300',
        },
      ]
    : []

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />

        {/* Hero estimate - centered */}
        <div className="flex flex-col items-center py-6 mb-10">
          <div className="h-3 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-3" />
          <div className="h-12 w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-2" />
          <div className="h-4 w-40 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
          <div className="h-px w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
          <div className="h-6 w-56 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
        </div>

        {/* Tabs - three pills */}
        <div className="mb-4">
          <div className="h-4 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
          <div className="flex gap-2 bg-paper-300 dark:bg-ink-300 rounded-lg p-1 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-10 bg-paper-200 dark:bg-ink-200 rounded-md animate-pulse" />
            ))}
          </div>
          <div className="h-20 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
        </div>

        {/* Stepper skeleton */}
        <div className="pt-6 mt-6 border-t border-paper-300 dark:border-ink-300">
          <div className="h-4 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />

          {/* Mobile: 4 milestones */}
          <div className="flex items-center justify-between w-full md:hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-paper-300 dark:bg-ink-300 animate-pulse" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  </div>
                </div>
                {i < 4 && (
                  <div className="flex-1 h-0.5 mx-2 bg-paper-300 dark:bg-ink-300 animate-pulse" style={{ marginBottom: '56px' }} />
                )}
              </div>
            ))}
          </div>

          {/* Desktop: 7 milestones */}
          <div className="hidden md:flex items-center justify-between w-full">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-paper-300 dark:bg-ink-300 animate-pulse" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  </div>
                </div>
                {i < 7 && (
                  <div className="flex-1 h-0.5 mx-2 bg-paper-300 dark:bg-ink-300 animate-pulse" style={{ marginBottom: '56px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!projection || !user) {
    return null
  }
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-8">
        Journey to Level 60
      </h2>

      {/* Hero Estimate - Elegant, Understated */}
      <div className="mb-10">
        {/* Main estimate display */}
        <div className="flex flex-col items-center text-center py-6">
          {/* Small label */}
          <div className="text-xs uppercase tracking-wider text-ink-400 dark:text-paper-300 mb-3">
            Estimated Completion
          </div>

          {/* Large date - ink colored, not vermillion */}
          <div className="text-4xl md:text-5xl font-display font-bold text-ink-100 dark:text-paper-100 mb-2">
            {primaryDate && format(primaryDate, 'MMMM yyyy')}
          </div>

          {/* Time remaining with subtle vermillion accent */}
          <div className="flex items-center gap-2 text-sm text-ink-400 dark:text-paper-300">
            <span>{primaryDate && formatDistanceToNow(primaryDate, { addSuffix: false })} remaining</span>
            <span className="w-1 h-1 rounded-full bg-vermillion-500" />
            <span>~{Math.round(primaryPace)} days/level</span>
          </div>

          {/* Subtle divider line with vermillion center accent */}
          <div className="mt-6 w-48 h-px bg-gradient-to-r from-transparent via-vermillion-500/40 to-transparent" />
        </div>

        {/* Method indicator - small, subtle */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-ink-400 dark:text-paper-300 bg-paper-300/50 dark:bg-ink-300/50 px-3 py-1 rounded-full">
            <span>{useActiveAverage ? 'Active pace' : 'All levels'}</span>
            <span className="w-1 h-1 rounded-full bg-ink-400/40 dark:bg-paper-300/40" aria-hidden="true" />
            <span>{averagingMethod === 'median' ? 'Median' : 'Trimmed mean'}</span>
            {useActiveAverage && projection.excludedLevels.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-ink-400/40 dark:bg-paper-300/40" aria-hidden="true" />
                <span>{completedLevels - projection.excludedLevels.length} levels</span>
                <button
                  onClick={() => setShowExcludedLevels(true)}
                  className="text-vermillion-500 hover:underline"
                >
                  (details)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scenarios - Tabbed Interface */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Projection Scenario
        </h3>

        {/* Tab selector - segmented control style */}
        <div className="flex bg-paper-300 dark:bg-ink-300 rounded-lg p-1 mb-6">
          {(['fast', 'expected', 'conservative'] as const).map((key) => {
            const scenario = scenarios.find(s =>
              (key === 'fast' && s.label === 'Fast track') ||
              (key === 'expected' && s.label === 'Expected') ||
              (key === 'conservative' && s.label === 'Conservative')
            )
            if (!scenario) return null

            const isActive = selectedScenario === key
            const Icon = scenario.icon

            return (
              <button
                key={key}
                onClick={() => setSelectedScenario(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-smooth',
                  isActive
                    ? 'bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 shadow-sm'
                    : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4',
                  isActive ? scenario.color : 'text-ink-400 dark:text-paper-300'
                )} />
                <span className="hidden sm:inline">{scenario.label}</span>
              </button>
            )
          })}
        </div>

        {/* Selected scenario details */}
        {scenarios.map((scenario) => {
          const scenarioKey =
            scenario.label === 'Fast track' ? 'fast' :
            scenario.label === 'Expected' ? 'expected' : 'conservative'

          if (selectedScenario !== scenarioKey) return null

          return (
            <div key={scenario.label} className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {format(scenario.date, 'MMMM d, yyyy')}
                </span>
                <span className={cn('text-sm font-medium', scenario.color)}>
                  {scenario.pace}
                </span>
              </div>
              <p className="text-sm text-ink-400 dark:text-paper-300">
                {scenario.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Milestones - Stepper Design */}
      <div className="pt-6 mt-6 border-t border-paper-300 dark:border-ink-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100">Journey Milestones</h3>
          <span className="text-xs text-ink-400 dark:text-paper-300">
            Based on {Math.round(selectedPace)} days/level
          </span>
        </div>

        {/* Stepper container - responsive */}
        <div className="relative">
          {/* Mobile: Reduced milestones */}
          <div className="flex items-center justify-between w-full md:hidden">
            {mobileMilestones.map((milestone, index) => {
              const isCompleted = milestone.status === 'completed'
              const isCurrent = user.level === milestone.level
              const isLast = index === mobileMilestones.length - 1
              const isStart = milestone.level === 1

              return (
                <div key={milestone.level} className="flex items-center flex-1 last:flex-none">
                  {/* Step */}
                  <div className="flex flex-col items-center">
                    {/* Circle */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs transition-all relative',
                      isCompleted && 'bg-patina-500 dark:bg-patina-400 text-paper-100',
                      isCurrent && 'bg-vermillion-500 text-paper-100 ring-4 ring-vermillion-500/20',
                      !isCompleted && !isCurrent && 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-400'
                    )}>
                      {isStart ? '★' : milestone.level}
                    </div>

                    {/* Label */}
                    <div className="mt-3 text-center">
                      <div className={cn(
                        'text-xs font-medium whitespace-nowrap',
                        isCompleted || isCurrent ? 'text-ink-100 dark:text-paper-100' : 'text-ink-400 dark:text-paper-300'
                      )}>
                        {isStart ? 'Start' : `L${milestone.level}`}
                      </div>
                      <div className={cn(
                        'text-xs mt-1 whitespace-nowrap',
                        isCompleted ? 'text-patina-500 dark:text-patina-400' : 'text-ink-400 dark:text-paper-300'
                      )}>
                        {format(milestone.date, 'MMM yy')}
                      </div>
                    </div>
                  </div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-2 relative" style={{ marginBottom: '56px' }}>
                      <div className="absolute inset-0 bg-paper-300 dark:bg-ink-300" />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-patina-500 dark:bg-patina-400" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop: All milestones */}
          <div className="hidden md:flex items-center justify-between w-full">
            {allMilestones.map((milestone, index) => {
              const isCompleted = milestone.status === 'completed'
              const isCurrent = user.level === milestone.level
              const isLast = index === allMilestones.length - 1
              const isStart = milestone.level === 1

              return (
                <div key={milestone.level} className="flex items-center flex-1 last:flex-none">
                  {/* Step */}
                  <div className="flex flex-col items-center">
                    {/* Circle */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs transition-all relative',
                      isCompleted && 'bg-patina-500 dark:bg-patina-400 text-paper-100',
                      isCurrent && 'bg-vermillion-500 text-paper-100 ring-4 ring-vermillion-500/20',
                      !isCompleted && !isCurrent && 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-400'
                    )}>
                      {isStart ? '★' : milestone.level}
                    </div>

                    {/* Label */}
                    <div className="mt-3 text-center">
                      <div className={cn(
                        'text-xs font-medium whitespace-nowrap',
                        isCompleted || isCurrent ? 'text-ink-100 dark:text-paper-100' : 'text-ink-400 dark:text-paper-300'
                      )}>
                        {isStart ? 'Start' : `L${milestone.level}`}
                      </div>
                      <div className={cn(
                        'text-xs mt-1 whitespace-nowrap',
                        isCompleted ? 'text-patina-500 dark:text-patina-400' : 'text-ink-400 dark:text-paper-300'
                      )}>
                        {format(milestone.date, 'MMM yy')}
                      </div>
                      {milestone.level === 60 && (
                        <div className="text-xs text-ink-400 dark:text-paper-300 mt-1 font-medium">
                          Master
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-2 relative" style={{ marginBottom: '56px' }}>
                      <div className="absolute inset-0 bg-paper-300 dark:bg-ink-300" />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-patina-500 dark:bg-patina-400" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Current position indicator (if between milestones) */}
          {!allMilestones.some(m => m.level === user.level) && user.level > 1 && (
            <div className="mt-4 text-xs text-ink-400 dark:text-paper-300 flex items-center gap-2">
              <div className="w-2 h-2 bg-vermillion-500 rounded-full" />
              <span>Currently at Level {user.level}</span>
            </div>
          )}
        </div>
      </div>

      {/* Excluded Levels Modal */}
      <Modal
        isOpen={showExcludedLevels && projection.excludedLevels.length > 0}
        onClose={() => setShowExcludedLevels(false)}
        size="md"
      >
        <div className="p-6">
          <h3 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
            Filtered Levels
          </h3>
          <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">
            These levels were excluded from your active average to provide a more accurate
            learning pace estimate:
          </p>
          <div className="space-y-3 mb-6">
            {projection.excludedLevels.map((level) => (
              <div
                key={level.level}
                className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm p-3 bg-paper-300 dark:bg-ink-300 rounded"
              >
                <span className="text-ink-100 dark:text-paper-100 font-medium">Level {level.level}</span>
                <span className="text-ink-400 dark:text-paper-300">
                  {level.days} days · {level.reason}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowExcludedLevels(false)}
            className="w-full px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
