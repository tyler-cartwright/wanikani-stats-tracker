import { useState } from 'react'
import { format, formatDistanceToNow, addDays } from 'date-fns'
import { Rocket, TrendingUp, Turtle } from 'lucide-react'
import { useUser, useLevelProgressions } from '@/lib/api/queries'
import { projectLevel60Date, calculateMilestones } from '@/lib/calculations/forecasting'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'

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
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const useActiveAverage = useSettingsStore((state) => state.useActiveAverage)

  const isLoading = userLoading || progressionsLoading || isSyncing

  // Calculate projection
  const projection = user && levelProgressions
    ? projectLevel60Date(user.level, levelProgressions)
    : null

  // Use setting to determine which average to use
  const primaryDate = projection ? (useActiveAverage ? projection.expectedActive : projection.expected) : null
  const primaryPace = projection ? (useActiveAverage ? projection.activeDaysPerLevel : projection.averageDaysPerLevel) : 0

  // Calculate conservative date based on selected pace
  const conservativeDate = user && projection
    ? addDays(new Date(), Math.round(primaryPace * 1.5 * (60 - user.level)))
    : null

  // Calculate milestones using the selected pace
  const milestones = user && projection
    ? calculateMilestones(user.level, primaryPace)
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
          color: 'text-patina-500',
        },
        {
          icon: TrendingUp,
          label: 'Expected',
          description: useActiveAverage
            ? 'Based on active learning pace (excludes breaks)'
            : 'Based on all completed levels',
          date: primaryDate,
          pace: `${Math.round(primaryPace)} days/level`,
          color: 'text-ink-100',
        },
        {
          icon: Turtle,
          label: 'Conservative',
          description: '50% slower than your current pace',
          date: conservativeDate,
          pace: `${Math.round(primaryPace * 1.5)} days/level`,
          color: 'text-ink-400',
        },
      ]
    : []

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="h-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="space-y-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
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

      {/* Hero Estimate */}
      <div className="bg-vermillion-500/10 dark:bg-vermillion-500/20 border border-vermillion-500/20 dark:border-vermillion-500/30 rounded-lg p-8 mb-8 text-center">
        <div className="text-sm text-ink-400 dark:text-paper-300 mb-2">
          Estimated {useActiveAverage ? '(active learning)' : '(all levels)'}
        </div>
        <div className="text-2xl font-display font-semibold text-vermillion-500 mb-1">
          {primaryDate && format(primaryDate, 'MMMM yyyy')}
        </div>
        <div className="text-sm text-ink-400 dark:text-paper-300">
          {primaryDate && formatDistanceToNow(primaryDate, { addSuffix: false })} remaining
        </div>

        {/* Excluded levels indicator - only show for active average */}
        {useActiveAverage && projection.excludedLevels.length > 0 && (
          <div className="mt-4 text-xs text-ink-400 dark:text-paper-300">
            Based on {completedLevels - projection.excludedLevels.length} active levels
            <button
              onClick={() => setShowExcludedLevels(true)}
              className="ml-2 text-vermillion-500 hover:underline"
            >
              (details)
            </button>
          </div>
        )}
      </div>

      {/* Scenarios */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-4">Scenarios</h3>
        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon
            return (
              <div
                key={scenario.label}
                className="flex items-center justify-between p-3 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${scenario.color}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                      {scenario.label}
                    </div>
                    <div className="text-xs text-ink-400 dark:text-paper-300">
                      {scenario.description}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
                    {format(scenario.date, 'MMM yyyy')}
                  </div>
                  <div className="text-xs text-ink-400 dark:text-paper-300">{scenario.pace}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestones Timeline */}
      <div className="pt-6 mt-6 border-t border-paper-300 dark:border-ink-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100">Milestones</h3>
          <span className="text-xs text-ink-400 dark:text-paper-300">
            Based on {Math.round(primaryPace)} days/level {useActiveAverage ? '(active)' : '(all)'}
          </span>
        </div>

        {/* Timeline visualization with padding */}
        <div className="relative pt-8 pb-24 px-6">
          {/* Background line */}
          <div className="absolute top-12 left-12 right-12 h-1 bg-paper-300 dark:bg-ink-300 rounded-full" />

          {/* Progress line (from start to current level) */}
          <div
            className="absolute top-12 left-12 h-1 bg-patina-500 dark:bg-patina-400 rounded-full transition-all duration-slow"
            style={{
              width: `calc((100% - 96px) * ${((user.level - 1) / 59)})`,
            }}
          />

          {/* Milestone markers container */}
          <div className="relative" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            {/* Start marker (Level 1) */}
            <div className="flex flex-col items-center" style={{ position: 'absolute', left: '0%', transform: 'translateX(0%)' }}>
              <div className="w-3 h-3 rounded-full bg-patina-500 dark:bg-patina-400 border-2 border-paper-200 dark:border-ink-200 mb-5" />
              <div className="text-xs font-medium text-ink-400 dark:text-paper-300 whitespace-nowrap mb-5">
                Lvl 1
              </div>
              <div className="text-xs text-ink-400 dark:text-paper-300 whitespace-nowrap md:rotate-0" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                Start
              </div>
            </div>

            {/* Milestone markers at 30, 40, 50, 60 */}
            {milestones.map((milestone) => {
              const position = ((milestone.level - 1) / 59) * 100
              const isCompleted = milestone.status === 'completed'
              const isCurrent = user.level === milestone.level

              return (
                <div
                  key={milestone.level}
                  className="flex flex-col items-center"
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* Marker dot */}
                  <div className={`
                    w-4 h-4 rounded-full border-2 border-paper-200 dark:border-ink-200 mb-5 transition-all
                    ${isCompleted
                      ? 'bg-patina-500 dark:bg-patina-400'
                      : isCurrent
                      ? 'bg-vermillion-500 dark:bg-vermillion-400 ring-4 ring-vermillion-500/20'
                      : 'bg-paper-400 dark:bg-ink-400'
                    }
                  `} />

                  {/* Level label */}
                  <div className={`
                    text-xs font-medium mb-5 whitespace-nowrap
                    ${isCompleted || isCurrent
                      ? 'text-ink-100 dark:text-paper-100'
                      : 'text-ink-400 dark:text-paper-300'
                    }
                  `}>
                    Lvl {milestone.level}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-ink-400 dark:text-paper-300 whitespace-nowrap md:rotate-0" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                    {isCompleted
                      ? 'Completed'
                      : format(milestone.date, 'MMM yyyy')
                    }
                  </div>
                </div>
              )
            })}

            {/* Current position indicator (if not on a milestone) */}
            {!milestones.some(m => m.level === user.level) && user.level > 1 && (
              <div
                className="flex flex-col items-center"
                style={{
                  position: 'absolute',
                  left: `${((user.level - 1) / 59) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="w-3 h-3 rounded-full bg-vermillion-500 dark:bg-vermillion-400 border-2 border-paper-200 dark:border-ink-200 ring-4 ring-vermillion-500/20 mb-5" />
                <div className="text-xs font-semibold text-vermillion-500 dark:text-vermillion-400 whitespace-nowrap mb-5">
                  Lvl {user.level}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300 whitespace-nowrap md:rotate-0" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                  Now
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excluded Levels Modal */}
      {showExcludedLevels && projection.excludedLevels.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-ink-100/50 dark:bg-paper-100/20 transition-opacity duration-300"
            onClick={() => setShowExcludedLevels(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 shadow-xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="p-6">
                <h3 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
                  Filtered Levels
                </h3>
                <p className="text-sm text-ink-400 dark:text-paper-300 mb-4">
                  These levels were excluded from your active average to provide a more accurate
                  learning pace estimate:
                </p>
                <div className="space-y-2 mb-6">
                  {projection.excludedLevels.map((level) => (
                    <div
                      key={level.level}
                      className="flex justify-between text-sm p-2 bg-paper-300 dark:bg-ink-300 rounded"
                    >
                      <span className="text-ink-100 dark:text-paper-100">Level {level.level}</span>
                      <span className="text-ink-400 dark:text-paper-300">
                        {level.days} days ({level.reason})
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
            </div>
          </div>
        </>
      )}
    </div>
  )
}
