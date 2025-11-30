// Activity Analysis and Break Detection
import { differenceInDays } from 'date-fns'
import type { LevelProgression } from '@/lib/api/types'

export interface ActivityPeriod {
  level: number
  days: number
  isActive: boolean // false if this was a break period
  reason?: 'vacation' | 'extended_gap' | 'outlier'
}

export interface ActiveAverageResult {
  activeAverage: number
  totalAverage: number
  excludedLevels: Array<{
    level: number
    days: number
    reason: string
  }>
  method: 'median' | 'trimmed_mean'
}

interface AnalysisOptions {
  outlierThreshold?: number // default: 3x median
  absoluteThreshold?: number // default: 60 days
}

/**
 * Calculate level durations from progressions
 */
function calculateLevelDurations(
  levelProgressions: LevelProgression[]
): Array<{ level: number; days: number }> {
  const durations: Array<{ level: number; days: number }> = []

  for (const progression of levelProgressions) {
    if (progression.passed_at && progression.unlocked_at) {
      const unlockedDate = new Date(progression.unlocked_at)
      const passedDate = new Date(progression.passed_at)
      const days = differenceInDays(passedDate, unlockedDate)

      if (days >= 0) {
        durations.push({
          level: progression.level,
          days,
        })
      }
    }
  }

  return durations
}

/**
 * Calculate median from an array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

/**
 * Calculate trimmed mean (exclude top and bottom 10%)
 */
function calculateTrimmedMean(numbers: number[]): number {
  if (numbers.length === 0) return 0
  if (numbers.length < 3) return numbers.reduce((a, b) => a + b, 0) / numbers.length

  const sorted = [...numbers].sort((a, b) => a - b)
  const trimCount = Math.floor(sorted.length * 0.1)

  // Remove top and bottom 10%
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount)

  if (trimmed.length === 0) return sorted.reduce((a, b) => a + b, 0) / sorted.length

  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
}

/**
 * Analyze level progressions to detect break periods
 */
export function analyzeActivityPeriods(
  levelProgressions: LevelProgression[],
  options: AnalysisOptions = {}
): ActivityPeriod[] {
  const outlierThreshold = options.outlierThreshold ?? 3
  const absoluteThreshold = options.absoluteThreshold ?? 60

  const durations = calculateLevelDurations(levelProgressions)

  if (durations.length === 0) {
    return []
  }

  // Calculate median for outlier detection
  const median = calculateMedian(durations.map((d) => d.days))
  const outlierCutoff = median * outlierThreshold

  // Mark each period as active or inactive
  return durations.map((duration) => {
    // Check if this is a break period
    if (duration.days >= absoluteThreshold) {
      return {
        level: duration.level,
        days: duration.days,
        isActive: false,
        reason: 'extended_gap' as const,
      }
    }

    if (duration.days > outlierCutoff && outlierCutoff > 0) {
      return {
        level: duration.level,
        days: duration.days,
        isActive: false,
        reason: 'outlier' as const,
      }
    }

    return {
      level: duration.level,
      days: duration.days,
      isActive: true,
    }
  })
}

/**
 * Get only active level durations (excluding breaks)
 */
export function getActiveLevelDurations(
  levelProgressions: LevelProgression[],
  options: AnalysisOptions = {}
): Array<{ level: number; days: number }> {
  const periods = analyzeActivityPeriods(levelProgressions, options)
  return periods.filter((p) => p.isActive).map((p) => ({ level: p.level, days: p.days }))
}

/**
 * Calculate active average excluding break periods
 * Uses trimmed mean (drop top/bottom 10%) for robustness
 */
export function calculateActiveAverage(
  levelProgressions: LevelProgression[],
  options: AnalysisOptions = {}
): ActiveAverageResult {
  const allDurations = calculateLevelDurations(levelProgressions)

  if (allDurations.length === 0) {
    return {
      activeAverage: 0,
      totalAverage: 0,
      excludedLevels: [],
      method: 'trimmed_mean',
    }
  }

  // Calculate total average
  const totalAverage = allDurations.reduce((sum, d) => sum + d.days, 0) / allDurations.length

  // Get activity periods
  const periods = analyzeActivityPeriods(levelProgressions, options)
  const activePeriods = periods.filter((p) => p.isActive)

  if (activePeriods.length === 0) {
    // All periods are breaks - fall back to total average
    return {
      activeAverage: totalAverage,
      totalAverage,
      excludedLevels: [],
      method: 'trimmed_mean',
    }
  }

  // Calculate active average using trimmed mean
  const activeDays = activePeriods.map((p) => p.days)
  const activeAverage = calculateTrimmedMean(activeDays)

  // Collect excluded levels
  const excludedLevels = periods
    .filter((p) => !p.isActive)
    .map((p) => ({
      level: p.level,
      days: p.days,
      reason: p.reason === 'extended_gap' ? 'Extended break (60+ days)' : 'Statistical outlier (3x median)',
    }))

  return {
    activeAverage: Math.round(activeAverage * 10) / 10,
    totalAverage: Math.round(totalAverage * 10) / 10,
    excludedLevels,
    method: 'trimmed_mean',
  }
}
