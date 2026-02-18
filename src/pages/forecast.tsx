import { useState, useMemo } from 'react'
import { useAssignments, useReviewStatistics, useSubjects, useUser } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { calculateWorkloadForecast } from '@/lib/calculations/workload-forecast'
import { calculateLevelProgressionForecast } from '@/lib/calculations/level-progression-forecast'
import { LessonPaceSelector } from '@/components/forecast/lesson-pace-selector'
import { ForecastMetrics } from '@/components/forecast/forecast-metrics'
import { LevelProgressionCard } from '@/components/forecast/level-progression-card'
import { WorkloadChart } from '@/components/forecast/workload-chart'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function Forecast() {
  useDocumentTitle('Forecast')
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: reviewStatistics, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: user, isLoading: userLoading } = useUser()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const forecastIncludeVocabulary = useSettingsStore((state) => state.forecastIncludeVocabulary)

  // Default to 15 lessons per day and 30 days forecast
  const [lessonsPerDay, setLessonsPerDay] = useState(15)
  const [forecastDays, setForecastDays] = useState(30)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly')

  const isLoading = assignmentsLoading || statsLoading || subjectsLoading || userLoading || isSyncing

  // Calculate forecast with memoization for performance
  const forecast = useMemo(() => {
    if (!assignments || !reviewStatistics || !user) return null

    return calculateWorkloadForecast({
      assignments,
      reviewStatistics,
      lessonsPerDay,
      forecastDays,
      userId: user.id,
    })
  }, [assignments, reviewStatistics, lessonsPerDay, forecastDays, user])

  // Calculate level progression forecast
  const levelProgression = useMemo(() => {
    if (!subjects || !assignments || !user) return null

    return calculateLevelProgressionForecast({
      subjects,
      assignments,
      currentLevel: user.level,
      lessonsPerDay,
      forecastDays,
      includeVocabulary: forecastIncludeVocabulary,
    })
  }, [subjects, assignments, user, lessonsPerDay, forecastDays, forecastIncludeVocabulary])

  // Empty state for new users
  if (!isLoading && assignments && assignments.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-12 shadow-sm text-center">
          <h2 className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
            No Assignments Yet
          </h2>
          <p className="text-ink-400 dark:text-paper-300 max-w-md mx-auto">
            Start your WaniKani lessons to see workload projections. The forecast will show you
            how your review load will evolve over time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      {isLoading ? (
        <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-lg p-4">
          <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
        </div>
      ) : (
        <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-lg p-4">
          <p className="text-sm text-ink-400 dark:text-paper-300">
            <span className="font-semibold text-ink-100 dark:text-paper-100">Note:</span> These forecasts are estimates based on your average accuracy rate and assume consistent daily performance. Actual results will vary depending on how well you do in your reviews each day.
          </p>
        </div>
      )}

      {/* Lesson Pace Selector + Metrics + Level Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:items-stretch">
        <LessonPaceSelector
          lessonsPerDay={lessonsPerDay}
          onLessonsChange={setLessonsPerDay}
          forecastDays={forecastDays}
          onForecastDaysChange={setForecastDays}
          isLoading={isLoading}
          className="h-full"
        />
        <div className="flex flex-col gap-6 h-full">
          <ForecastMetrics
            metrics={forecast?.metrics || null}
            isLoading={isLoading}
            forecastDays={forecastDays}
          />
          <LevelProgressionCard
            result={levelProgression}
            isLoading={isLoading}
            forecastDays={forecastDays}
            className="flex-1"
          />
        </div>
      </div>

      {/* Chart */}
      <WorkloadChart
        dailyForecast={forecast?.dailyForecast || null}
        metrics={forecast?.metrics || null}
        isLoading={isLoading}
        forecastDays={forecastDays}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  )
}
