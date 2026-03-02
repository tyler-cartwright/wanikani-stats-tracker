// Cached calculation queries to avoid recomputing expensive operations
import { useQuery } from '@tanstack/react-query'
import { useAssignments, useSubjects, useReviewStatistics, useLevelProgressions, useResets } from './queries'
import { detectLeeches, findConfusionPairs, findRootCauseRadicals } from '@/lib/calculations/leeches'
import { calculateReviewForecast, projectLevel60Date } from '@/lib/calculations/forecasting'
import { calculateWorkloadForecast } from '@/lib/calculations/workload-forecast'
import { calculateJLPTReadiness } from '@/lib/calculations/jlpt-readiness'
import { calculateKanjiGridData } from '@/lib/calculations/kanji-grid'
import type { WorkloadForecastInput } from '@/lib/calculations/workload-forecast'

const CALCULATION_STALE_TIME = 5 * 60 * 1000 // 5 minutes
const CALCULATION_GC_TIME = 30 * 60 * 1000 // 30 minutes

/**
 * Cached leech detection
 */
export function useLeechDetection(threshold?: {
  minReviews?: number
  maxAccuracy?: number
  includeBurned?: boolean
}) {
  const { data: reviewStats } = useReviewStatistics()
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()

  return useQuery({
    queryKey: ['leeches', threshold],
    queryFn: () => {
      if (!reviewStats || !subjects || !assignments) {
        throw new Error('Required data not loaded')
      }
      return detectLeeches(reviewStats, subjects, assignments, threshold)
    },
    enabled: !!reviewStats && !!subjects && !!assignments,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached confusion pairs calculation
 */
export function useConfusionPairs() {
  const { data: leeches } = useLeechDetection()

  return useQuery({
    queryKey: ['confusionPairs'],
    queryFn: () => {
      if (!leeches) throw new Error('Leeches not loaded')
      return findConfusionPairs(leeches)
    },
    enabled: !!leeches,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached root cause radicals calculation
 */
export function useRootCauseRadicals() {
  const { data: leeches } = useLeechDetection()
  const { data: subjects } = useSubjects()

  return useQuery({
    queryKey: ['rootCauseRadicals'],
    queryFn: () => {
      if (!leeches || !subjects) throw new Error('Required data not loaded')
      return findRootCauseRadicals(leeches, subjects)
    },
    enabled: !!leeches && !!subjects,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached review forecast calculation
 */
export function useReviewForecast() {
  const { data: assignments } = useAssignments()

  return useQuery({
    queryKey: ['reviewForecast'],
    queryFn: () => {
      if (!assignments) throw new Error('Assignments not loaded')
      return calculateReviewForecast(assignments)
    },
    enabled: !!assignments,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached level 60 projection
 */
export function useLevel60Projection(currentLevel: number, autoExcludeBreaks: boolean = true) {
  const { data: levelProgressions } = useLevelProgressions()
  const { data: resets } = useResets()

  return useQuery({
    queryKey: ['level60Projection', currentLevel, autoExcludeBreaks],
    queryFn: () => {
      if (!levelProgressions) throw new Error('Level progressions not loaded')
      return projectLevel60Date(currentLevel, levelProgressions, autoExcludeBreaks, resets || [])
    },
    enabled: !!levelProgressions,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached workload forecast calculation
 */
export function useWorkloadForecast(input: Omit<WorkloadForecastInput, 'assignments' | 'reviewStatistics'>) {
  const { data: assignments } = useAssignments()
  const { data: reviewStatistics } = useReviewStatistics()

  return useQuery({
    queryKey: ['workloadForecast', input.lessonsPerDay, input.forecastDays, input.userId],
    queryFn: () => {
      if (!assignments || !reviewStatistics) {
        throw new Error('Required data not loaded')
      }
      return calculateWorkloadForecast({
        ...input,
        assignments,
        reviewStatistics,
      })
    },
    enabled: !!assignments && !!reviewStatistics,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached JLPT readiness calculation
 */
export function useJLPTReadiness(jlptLevel: number, srsThreshold: number) {
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()

  return useQuery({
    queryKey: ['jlptReadiness', jlptLevel, srsThreshold],
    queryFn: () => {
      if (!subjects || !assignments) {
        throw new Error('Required data not loaded')
      }
      return calculateJLPTReadiness(subjects, assignments, jlptLevel, srsThreshold)
    },
    enabled: !!subjects && !!assignments,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}

/**
 * Cached kanji grid data calculation
 */
export function useKanjiGridData(filters?: {
  levels?: number[]
  srsStages?: number[]
  types?: ('radical' | 'kanji')[]
}) {
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()

  return useQuery({
    queryKey: ['kanjiGrid', filters],
    queryFn: () => {
      if (!subjects || !assignments) {
        throw new Error('Required data not loaded')
      }
      return calculateKanjiGridData(subjects, assignments, filters)
    },
    enabled: !!subjects && !!assignments,
    staleTime: CALCULATION_STALE_TIME,
    gcTime: CALCULATION_GC_TIME,
  })
}
