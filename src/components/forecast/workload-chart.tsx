import { format } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import type { DailyForecast, WorkloadMetrics } from '@/lib/calculations/workload-forecast'
import { aggregateToWeekly } from '@/lib/calculations/workload-forecast'

interface WorkloadChartProps {
  dailyForecast: DailyForecast[] | null
  metrics: WorkloadMetrics | null
  isLoading: boolean
  forecastDays: number
  viewMode: 'daily' | 'weekly'
  onViewModeChange: (mode: 'daily' | 'weekly') => void
}

export function WorkloadChart({
  dailyForecast,
  metrics,
  isLoading,
  forecastDays,
  viewMode,
  onViewModeChange,
}: WorkloadChartProps) {
  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />

        {/* Horizontal bar skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div
                className="flex-1 h-8 bg-paper-300 dark:bg-ink-300 rounded animate-pulse"
                style={{ width: `${Math.random() * 60 + 40}%` }}
              />
              <div className="w-12 h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!dailyForecast || !metrics) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <p className="text-center text-ink-400 dark:text-paper-300">
          No forecast data available
        </p>
      </div>
    )
  }

  // Aggregate to weekly if needed
  const weeklyForecast = viewMode === 'weekly' ? aggregateToWeekly(dailyForecast) : null
  const maxCount = metrics.maxDaily

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      {/* Header with view toggle */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
            {forecastDays}-Day Workload Forecast
          </h2>
          <InfoTooltip content="Predicts your daily review workload based on your current assignments and planned lessons (starting tomorrow). Dark green shows reviews from items already in your queue. Light green shows reviews from new lessons. The forecast uses your historical accuracy rate to estimate how items progress through the SRS system." />
        </div>

        {/* View toggle - full width on mobile, right-aligned on desktop */}
        <div className="flex sm:justify-end">
          <div className="flex w-full sm:w-auto rounded-lg border border-paper-300 dark:border-ink-300 p-1 bg-paper-100 dark:bg-ink-100">
            <button
              onClick={() => onViewModeChange('daily')}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-smooth focus-ring',
                viewMode === 'daily'
                  ? 'bg-vermillion-500 text-white'
                  : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
              )}
            >
              Daily
            </button>
            <button
              onClick={() => onViewModeChange('weekly')}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-smooth focus-ring',
                viewMode === 'weekly'
                  ? 'bg-vermillion-500 text-white'
                  : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
              )}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Chart container with horizontal bars */}
      <div className="space-y-2 w-full overflow-visible">
        {viewMode === 'daily' && dailyForecast && dailyForecast.map((day, index) => {
          const widthPercentage = maxCount > 0 ? (day.totalReviews / maxCount) * 100 : 0
          const existingPercentage = day.totalReviews > 0 ? (day.existingReviews / day.totalReviews) * 100 : 0

          return (
            <div
              key={index}
              className="group flex items-center gap-3 py-1"
            >
              {/* Day label */}
              <div className="w-16 sm:w-20 flex-shrink-0 text-sm tabular-nums">
                <span className="font-medium text-ink-400 dark:text-paper-300">
                  {format(day.date, 'MMM d')}
                </span>
              </div>

              {/* Horizontal stacked bar */}
              <div className="flex-1 min-w-0 relative group/bar">
                {day.totalReviews > 0 ? (
                  <div className="relative h-8 flex items-center">
                    <div
                      className="h-full rounded-md flex overflow-hidden transition-all duration-slow"
                      style={{ width: `${widthPercentage}%` }}
                    >
                      {/* Existing reviews portion */}
                      {day.existingReviews > 0 && (
                        <div
                          style={{ width: `${existingPercentage}%` }}
                          className="h-full bg-patina-500 dark:bg-patina-400"
                        />
                      )}
                      {/* New lesson reviews portion */}
                      {day.newLessonReviews > 0 && (
                        <div
                          style={{ width: `${100 - existingPercentage}%` }}
                          className="h-full bg-patina-300 dark:bg-patina-600"
                        />
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute left-0 top-full mt-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs px-3 py-2 rounded-lg shadow-lg" style={{ minWidth: '200px' }}>
                      <div className="font-semibold mb-1">
                        {format(day.date, 'MMMM d, yyyy')}
                      </div>
                      <div className="mb-2">Total: {day.totalReviews} reviews</div>
                      <div className="text-[10px] opacity-80 space-y-0.5">
                        <div>• Existing queue: {day.existingReviews}</div>
                        <div>• New lessons: {day.newLessonReviews}</div>
                        <div className="italic mt-1 pt-1 border-t border-paper-100/20 dark:border-ink-100/20">
                          Includes same-day follow-ups
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-8 flex items-center">
                    <div className="h-1 w-2 bg-paper-300 dark:bg-ink-300 rounded" />
                  </div>
                )}
              </div>

              {/* Count label */}
              <div className="w-12 sm:w-16 flex-shrink-0 text-right text-sm tabular-nums">
                <span className="font-semibold text-ink-100 dark:text-paper-100">
                  {day.totalReviews}
                </span>
              </div>
            </div>
          )
        })}

        {viewMode === 'weekly' && weeklyForecast && weeklyForecast.map((week) => {
          const widthPercentage = maxCount > 0 ? (week.dailyAverage / maxCount) * 100 : 0
          const existingPercentage = week.totalReviews > 0 ? (week.existingReviews / week.totalReviews) * 100 : 0

          return (
            <div key={week.weekNumber} className="group py-2">
              {/* Mobile: stacked layout */}
              <div className="sm:hidden space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-ink-400 dark:text-paper-300">
                    Week {week.weekNumber}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink-100 dark:text-paper-100">
                    {week.totalReviews}
                  </span>
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300 tabular-nums">
                  {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d')}
                </div>

                {/* Full-width bar */}
                <div className="relative group/bar">
                  {week.totalReviews > 0 ? (
                    <div className="relative h-8">
                      <div
                        className="h-full rounded-md flex overflow-hidden transition-all duration-slow"
                        style={{ width: `${widthPercentage}%` }}
                      >
                        {/* Existing reviews portion */}
                        {week.existingReviews > 0 && (
                          <div
                            style={{ width: `${existingPercentage}%` }}
                            className="h-full bg-patina-500 dark:bg-patina-400"
                          />
                        )}
                        {/* New lesson reviews portion */}
                        {week.newLessonReviews > 0 && (
                          <div
                            style={{ width: `${100 - existingPercentage}%` }}
                            className="h-full bg-patina-300 dark:bg-patina-600"
                          />
                        )}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute left-0 top-full mt-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs px-3 py-2 rounded-lg shadow-lg" style={{ minWidth: '200px' }}>
                        <div className="font-semibold mb-1">
                          Week {week.weekNumber}
                        </div>
                        <div className="mb-2">Total: {week.totalReviews} reviews</div>
                        <div className="mb-2">Daily avg: {week.dailyAverage} reviews/day</div>
                        <div className="text-[10px] opacity-80 space-y-0.5">
                          <div>• Existing queue: {week.existingReviews}</div>
                          <div>• New lessons: {week.newLessonReviews}</div>
                          <div className="italic mt-1 pt-1 border-t border-paper-100/20 dark:border-ink-100/20">
                            Includes same-day follow-ups
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-8 flex items-center">
                      <div className="h-1 w-2 bg-paper-300 dark:bg-ink-300 rounded" />
                    </div>
                  )}
                </div>

                <div className="text-xs text-ink-400 dark:text-paper-300 tabular-nums">
                  {week.dailyAverage}/day avg
                </div>
              </div>

              {/* Desktop: horizontal layout (existing code) */}
              <div className="hidden sm:flex items-center gap-3">
                {/* Week label */}
                <div className="w-32 flex-shrink-0 text-sm">
                  <div className="font-medium text-ink-400 dark:text-paper-300">
                    Week {week.weekNumber}
                  </div>
                  <div className="text-xs text-ink-400 dark:text-paper-300 tabular-nums">
                    {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d')}
                  </div>
                </div>

                {/* Horizontal stacked bar */}
                <div className="flex-1 min-w-0 relative group/bar">
                  {week.totalReviews > 0 ? (
                    <div className="relative h-10 flex items-center">
                      <div
                        className="h-full rounded-md flex overflow-hidden transition-all duration-slow"
                        style={{ width: `${widthPercentage}%` }}
                      >
                        {/* Existing reviews portion */}
                        {week.existingReviews > 0 && (
                          <div
                            style={{ width: `${existingPercentage}%` }}
                            className="h-full bg-patina-500 dark:bg-patina-400"
                          />
                        )}
                        {/* New lesson reviews portion */}
                        {week.newLessonReviews > 0 && (
                          <div
                            style={{ width: `${100 - existingPercentage}%` }}
                            className="h-full bg-patina-300 dark:bg-patina-600"
                          />
                        )}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute left-0 top-full mt-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs px-3 py-2 rounded-lg shadow-lg" style={{ minWidth: '200px' }}>
                        <div className="font-semibold mb-1">
                          Week {week.weekNumber}
                        </div>
                        <div className="mb-2">Total: {week.totalReviews} reviews</div>
                        <div className="mb-2">Daily avg: {week.dailyAverage} reviews/day</div>
                        <div className="text-[10px] opacity-80 space-y-0.5">
                          <div>• Existing queue: {week.existingReviews}</div>
                          <div>• New lessons: {week.newLessonReviews}</div>
                          <div className="italic mt-1 pt-1 border-t border-paper-100/20 dark:border-ink-100/20">
                            Includes same-day follow-ups
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 flex items-center">
                      <div className="h-1 w-2 bg-paper-300 dark:bg-ink-300 rounded" />
                    </div>
                  )}
                </div>

                {/* Count label */}
                <div className="w-24 flex-shrink-0 text-right text-sm">
                  <div className="font-semibold tabular-nums text-ink-100 dark:text-paper-100">
                    {week.totalReviews}
                  </div>
                  <div className="text-xs text-ink-400 dark:text-paper-300 tabular-nums">
                    {week.dailyAverage}/day
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-paper-300 dark:border-ink-300">
        <div className="text-xs text-ink-400 dark:text-paper-300">
          Max: {maxCount} reviews · Avg: {metrics.averageDaily} reviews/day
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-patina-500 dark:bg-patina-400 rounded-full" />
            <span className="text-ink-400 dark:text-paper-300">Existing items</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-patina-300 dark:bg-patina-600 rounded-full" />
            <span className="text-ink-400 dark:text-paper-300">New lessons</span>
          </div>
        </div>
      </div>
    </div>
  )
}
