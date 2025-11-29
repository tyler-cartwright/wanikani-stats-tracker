import { format, formatDistanceToNow } from 'date-fns'
import { Rocket, TrendingUp, Turtle } from 'lucide-react'
import { useUser, useLevelProgressions } from '@/lib/api/queries'
import { projectLevel60Date, calculateMilestones } from '@/lib/calculations/forecasting'

interface Scenario {
  icon: typeof Rocket
  label: string
  date: Date
  pace: string
  color: string
}

export function Level60Projection() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: levelProgressions, isLoading: progressionsLoading } = useLevelProgressions()

  const isLoading = userLoading || progressionsLoading

  // Calculate projection
  const projection = user && levelProgressions
    ? projectLevel60Date(user.level, levelProgressions)
    : null

  // Calculate milestones
  const milestones = user && projection
    ? calculateMilestones(user.level, projection.averageDaysPerLevel)
    : []

  // Build scenarios
  const scenarios: Scenario[] = projection
    ? [
        {
          icon: Rocket,
          label: 'Fast track',
          date: projection.fastTrack,
          pace: '8 days/level',
          color: 'text-patina-500',
        },
        {
          icon: TrendingUp,
          label: 'Expected',
          date: projection.expected,
          pace: `${Math.round(projection.averageDaysPerLevel)} days/level`,
          color: 'text-ink-100',
        },
        {
          icon: Turtle,
          label: 'Conservative',
          date: projection.conservative,
          pace: `${Math.round(projection.averageDaysPerLevel * 1.5)} days/level`,
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
        <div className="text-sm text-ink-400 dark:text-paper-300 mb-2">Estimated</div>
        <div className="text-2xl font-display font-semibold text-vermillion-500 mb-1">
          {format(projection.expected, 'MMMM yyyy')}
        </div>
        <div className="text-sm text-ink-400 dark:text-paper-300">
          {formatDistanceToNow(projection.expected, { addSuffix: false })} remaining
        </div>
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
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${scenario.color}`} />
                  <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
                    {scenario.label}
                  </span>
                </div>
                <div className="text-right">
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

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-4">Milestones</h3>
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.level}
              className="flex items-center justify-between p-3 rounded-md"
            >
              <div className="flex items-center gap-3">
                {milestone.status === 'completed' ? (
                  <div className="w-5 h-5 rounded-full bg-patina-500 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-paper-100 dark:text-ink-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-paper-400 dark:border-ink-400" />
                )}
                <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
                  Level {milestone.level}
                </span>
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300">
                {milestone.status === 'completed'
                  ? 'Completed'
                  : `~${format(milestone.date, 'MMM yyyy')}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
