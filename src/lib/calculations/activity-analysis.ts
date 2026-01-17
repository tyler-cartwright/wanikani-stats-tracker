// Activity Analysis with MAD (Median Absolute Deviation)
import { differenceInDays } from 'date-fns'
import type { LevelProgression } from '@/lib/api/types'

export interface UnifiedLevelAnalysis {
  median: number
  mad: number
  normalizedMad: number
  outlierThreshold: number // Threshold for auto-detecting breaks (median + 2×MAD)
  average: number // Trimmed mean of included levels
  stdDev: number // Calculated from included levels for pace bands

  includedLevels: Array<{
    level: number
    days: number
    milliseconds: number
    pace: 'fast' | 'good' | 'slow' | 'very-slow'
  }>

  excludedLevels: Array<{
    level: number
    days: number
    reason: 'outlier'
  }>

  bands: {
    fast: number // < avg - 0.5σ
    good: number // within ±0.5σ
    slow: number // +0.5σ to +1.5σ
    verySlow: number // > +1.5σ
  }
}

/**
 * Calculate level durations from progressions
 */
function calculateLevelDurations(
  levelProgressions: LevelProgression[]
): Array<{ level: number; days: number; milliseconds: number }> {
  const durations: Array<{ level: number; days: number; milliseconds: number }> = []

  for (const progression of levelProgressions) {
    if (progression.passed_at && progression.unlocked_at) {
      const unlockedDate = new Date(progression.unlocked_at)
      const passedDate = new Date(progression.passed_at)
      const days = differenceInDays(passedDate, unlockedDate)
      const milliseconds = passedDate.getTime() - unlockedDate.getTime()

      if (days >= 0) {
        durations.push({
          level: progression.level,
          days,
          milliseconds,
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
 * Calculate MAD (Median Absolute Deviation)
 */
function calculateMAD(values: number[], median: number): number {
  if (values.length === 0) return 0

  const deviations = values.map(value => Math.abs(value - median))
  return calculateMedian(deviations)
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
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

/**
 * Determine pace using statistical approach (standard deviation)
 */
function determinePace(
  days: number,
  mean: number,
  stdDev: number
): 'fast' | 'good' | 'slow' | 'very-slow' {
  if (days < mean - 0.5 * stdDev) return 'fast'
  if (days > mean + 1.5 * stdDev) return 'very-slow'
  if (days > mean + 0.5 * stdDev) return 'slow'
  return 'good'
}

/**
 * New unified analysis function using MAD for outlier detection
 *
 * @param progressions - Array of level progressions
 * @param autoExcludeBreaks - Whether to automatically exclude outlier levels as breaks (default: true)
 */
export function analyzeUnifiedLevelData(
  progressions: LevelProgression[],
  autoExcludeBreaks: boolean = true
): UnifiedLevelAnalysis {
  const durations = calculateLevelDurations(progressions)

  // Handle edge case: no data
  if (durations.length === 0) {
    return {
      median: 0,
      mad: 0,
      normalizedMad: 0,
      outlierThreshold: 0,
      average: 0,
      stdDev: 0,
      includedLevels: [],
      excludedLevels: [],
      bands: { fast: 0, good: 0, slow: 0, verySlow: 0 },
    }
  }

  const daysArray = durations.map(d => d.days)

  // Calculate MAD
  const median = calculateMedian(daysArray)
  const mad = calculateMAD(daysArray, median)
  const normalizedMad = mad * 1.4826 // Convert to standard deviation equivalent

  // Outlier detection: exclude if > median + 2 × normalizedMAD
  // Using 2× multiplier for tighter outlier detection (more aggressive than 3×)
  // But only if we have 5+ levels (need sufficient data for outlier detection)
  const outlierThreshold = median + 2 * normalizedMad
  const shouldDetectOutliers = autoExcludeBreaks && durations.length >= 5

  const includedDurations: Array<{ level: number; days: number; milliseconds: number }> = []
  const excludedDurations: Array<{ level: number; days: number; reason: 'outlier' }> = []

  for (const duration of durations) {
    if (shouldDetectOutliers && duration.days > outlierThreshold) {
      excludedDurations.push({
        level: duration.level,
        days: duration.days,
        reason: 'outlier',
      })
    } else {
      includedDurations.push(duration)
    }
  }

  // Edge case: If all levels would be excluded (rare), include all
  if (includedDurations.length === 0) {
    includedDurations.push(...durations)
    excludedDurations.length = 0
  }

  // Calculate statistics from included levels only
  const includedDaysArray = includedDurations.map(d => d.days)
  const average = calculateTrimmedMean(includedDaysArray)
  const stdDev = calculateStdDev(includedDaysArray, average)

  // Calculate pace bands
  const bands = {
    fast: average - 0.5 * stdDev,
    good: average,
    slow: average + 0.5 * stdDev,
    verySlow: average + 1.5 * stdDev,
  }

  // Add pace to included levels
  const includedLevels = includedDurations.map(d => ({
    level: d.level,
    days: d.days,
    milliseconds: d.milliseconds,
    pace: determinePace(d.days, average, stdDev),
  }))

  return {
    median,
    mad,
    normalizedMad,
    outlierThreshold: Math.round(outlierThreshold * 10) / 10,
    average: Math.round(average * 10) / 10,
    stdDev,
    includedLevels,
    excludedLevels: excludedDurations,
    bands,
  }
}
