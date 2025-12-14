import { useMemo } from 'react'
import { format } from 'date-fns'
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAssignments, useSubjects } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { calculateBurnVelocity, type BurnPeriod } from '@/lib/calculations/burn-velocity'

interface VelocityStatProps {
  period: string
  data: BurnPeriod
  trend?: 'up' | 'down' | 'stable'
}

function VelocityStat({ period, data, trend }: VelocityStatProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-4">
      <div className="text-xs text-ink-400 dark:text-paper-300 mb-2">{period}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-ink-100 dark:text-paper-100">
            {data.count.toLocaleString()}
          </div>
          <div className="text-xs text-ink-400 dark:text-paper-300">
            ~{data.rate.toFixed(1)}/day
          </div>
        </div>
        {trend && (
          <TrendIcon
            className={cn(
              'w-5 h-5',
              trend === 'up' && 'text-patina-600 dark:text-patina-500',
              trend === 'down' && 'text-vermillion-500 dark:text-vermillion-400',
              trend === 'stable' && 'text-ink-400 dark:text-paper-300'
            )}
          />
        )}
      </div>
    </div>
  )
}

function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-paper-300 dark:stroke-ink-300"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-vermillion-500 dark:stroke-vermillion-400 transition-all duration-slow"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-ink-100 dark:text-paper-100">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export function BurnVelocity() {
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = assignmentsLoading || subjectsLoading || isSyncing

  const velocity = useMemo(() => {
    if (!assignments || !subjects) return null
    return calculateBurnVelocity(assignments, subjects)
  }, [assignments, subjects])

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />

        {/* Hero section */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-32 h-32 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-3/4" />
          </div>
        </div>

        {/* Velocity stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-4">
              <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-16 mb-3" />
              <div className="h-8 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-20 mb-2" />
              <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-24" />
            </div>
          ))}
        </div>

        {/* Projection */}
        <div className="border-t border-paper-300 dark:border-ink-300 pt-4">
          <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-48 mb-2" />
          <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
        </div>
      </div>
    )
  }

  if (!velocity) {
    return null
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-8">
        <Flame className="w-5 h-5 text-vermillion-500" />
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Burn Progress
        </h2>
      </div>

      {/* Hero: Progress ring and stats */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <ProgressRing percentage={velocity.burnPercentage} />
        <div>
          <div className="text-3xl md:text-4xl font-display font-bold text-ink-100 dark:text-paper-100">
            {velocity.totalBurned.toLocaleString()}
          </div>
          <div className="text-sm text-ink-400 dark:text-paper-300 mt-1">
            of {velocity.totalItems.toLocaleString()} items burned
          </div>
          {velocity.totalBurned > 0 && (
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-vermillion-500" />
              {(velocity.totalItems - velocity.totalBurned).toLocaleString()} remaining
            </div>
          )}
        </div>
      </div>

      {/* Velocity stats: 7/30/90 day rates with trends */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <VelocityStat period="Last 7 days" data={velocity.last7Days} trend={velocity.trend7Days} />
        <VelocityStat period="Last 30 days" data={velocity.last30Days} trend={velocity.trend30Days} />
        <VelocityStat period="Last 90 days" data={velocity.last90Days} />
      </div>

      {/* Projection */}
      {velocity.projectedBurnDate && velocity.daysToComplete && (
        <div className="border-t border-paper-300 dark:border-ink-300 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs text-ink-400 dark:text-paper-300 mb-1">
                At current pace, all items burned by:
              </div>
              <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                {format(velocity.projectedBurnDate, 'MMMM yyyy')}
              </div>
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 bg-paper-300/50 dark:bg-ink-300/50 px-3 py-1.5 rounded-full self-start sm:self-center">
              ~{velocity.daysToComplete.toLocaleString()} days remaining
            </div>
          </div>
        </div>
      )}

      {/* No burns yet message */}
      {velocity.totalBurned === 0 && (
        <div className="text-center py-4 text-sm text-ink-400 dark:text-paper-300">
          No items burned yet. Keep reviewing to reach Enlightened!
        </div>
      )}
    </div>
  )
}
