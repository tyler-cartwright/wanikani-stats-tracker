// Forecasting and Projection Calculations
import { addHours, addDays, addMonths } from 'date-fns'
import type { Assignment, LevelProgression } from '@/lib/api/types'
import { analyzeUnifiedLevelData } from './activity-analysis'

export interface ReviewForecast {
  current: number
  next2h: number
  next6h: number
  next12h: number
  next24h: number
  peak: {
    time: Date
    count: number
  }
  hourlyBreakdown: Array<{
    time: Date
    count: number
  }>
}

export interface Level60Projection {
  expected: Date
  fastTrack: Date
  conservative: Date
  averageDaysPerLevel: number
  medianDaysPerLevel: number
  outlierThreshold: number
  fastestLevel: {
    level: number
    days: number
  }
  slowestLevel: {
    level: number
    days: number
  }
  excludedLevels: Array<{
    level: number
    days: number
    reason: string
  }>
}

/**
 * Calculate review forecast from assignments data
 */
export function calculateReviewForecast(assignments: Assignment[]): ReviewForecast {
  const now = new Date()

  // Count reviews by availability
  let current = 0
  let next2h = 0
  let next6h = 0
  let next12h = 0
  let next24h = 0

  // Also track by hour for visualization
  const reviewsByHour = new Map<number, number>()

  for (const assignment of assignments) {
    // Skip if hidden from reviews or not ready
    if (assignment.hidden) continue // Hidden items don't appear in review queue
    if (!assignment.available_at) continue
    if (assignment.srs_stage === 0) continue // Not unlocked
    if (assignment.srs_stage === 9) continue // Burned

    const availableAt = new Date(assignment.available_at)
    const msFromNow = availableAt.getTime() - now.getTime()
    const hoursFromNow = msFromNow / (1000 * 60 * 60)

    // Count cumulative totals based on actual availability time
    if (msFromNow <= 0) {
      // Already available
      current += 1
      next2h += 1
      next6h += 1
      next12h += 1
      next24h += 1
    } else if (hoursFromNow < 2) {
      next2h += 1
      next6h += 1
      next12h += 1
      next24h += 1
    } else if (hoursFromNow < 6) {
      next6h += 1
      next12h += 1
      next24h += 1
    } else if (hoursFromNow < 12) {
      next12h += 1
      next24h += 1
    } else if (hoursFromNow < 24) {
      next24h += 1
    }

    // For visualization, bucket by hour
    const hourBucket = msFromNow <= 0 ? 0 : Math.floor(hoursFromNow)
    if (hourBucket < 24) {
      const currentCount = reviewsByHour.get(hourBucket) || 0
      reviewsByHour.set(hourBucket, currentCount + 1)
    }
  }

  // Find peak hour
  let peakHour = 0
  let peakCount = 0
  reviewsByHour.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count
      peakHour = hour
    }
  })

  // Create hourly breakdown
  const hourlyBreakdown = Array.from({ length: 24 }, (_, i) => ({
    time: addHours(now, i),
    count: reviewsByHour.get(i) || 0,
  }))

  return {
    current,
    next2h,
    next6h,
    next12h,
    next24h,
    peak: {
      time: addHours(now, peakHour),
      count: peakCount,
    },
    hourlyBreakdown,
  }
}

/**
 * Project date to reach level 60 based on historical pace
 * Now using unified MAD analysis
 *
 * @param currentLevel - User's current level
 * @param levelProgressions - Array of level progressions
 * @param autoExcludeBreaks - Whether to automatically exclude outlier levels as breaks (default: true)
 */
export function projectLevel60Date(
  currentLevel: number,
  levelProgressions: LevelProgression[],
  autoExcludeBreaks: boolean = true
): Level60Projection {
  if (currentLevel >= 60) {
    // Already at max level
    return {
      expected: new Date(),
      fastTrack: new Date(),
      conservative: new Date(),
      averageDaysPerLevel: 0,
      medianDaysPerLevel: 0,
      outlierThreshold: 0,
      fastestLevel: { level: 60, days: 0 },
      slowestLevel: { level: 60, days: 0 },
      excludedLevels: [],
    }
  }

  // Use unified MAD analysis
  const analysis = analyzeUnifiedLevelData(levelProgressions, autoExcludeBreaks)

  if (analysis.includedLevels.length === 0) {
    // No historical data, use default estimates
    const now = new Date()
    return {
      expected: addMonths(now, (60 - currentLevel) * 0.4), // ~12 days/level
      fastTrack: addMonths(now, (60 - currentLevel) * 0.27), // ~8 days/level
      conservative: addMonths(now, (60 - currentLevel) * 0.6), // ~18 days/level
      averageDaysPerLevel: 12,
      medianDaysPerLevel: 12,
      outlierThreshold: 0,
      fastestLevel: { level: currentLevel, days: 8 },
      slowestLevel: { level: currentLevel, days: 18 },
      excludedLevels: [],
    }
  }

  // Calculate average days per level from included levels (trimmed mean)
  const averageDaysPerLevel = analysis.average

  // Calculate median
  const medianDaysPerLevel = analysis.median

  // Find fastest and slowest from included levels
  const sortedIncluded = [...analysis.includedLevels].sort((a, b) => a.days - b.days)
  const fastestLevel = {
    level: sortedIncluded[0].level,
    days: sortedIncluded[0].days,
  }
  const slowestLevel = {
    level: sortedIncluded[sortedIncluded.length - 1].level,
    days: sortedIncluded[sortedIncluded.length - 1].days,
  }

  // Calculate projections
  const levelsRemaining = 60 - currentLevel
  const now = new Date()

  // Use trimmed mean for expected
  const expected = addDays(now, Math.round(averageDaysPerLevel * levelsRemaining))

  // Fast track: 8 days per level (WK speed run pace)
  const fastTrack = addDays(now, 8 * levelsRemaining)

  // Conservative: Use trimmed mean * 1.5
  const conservativePace = Math.max(averageDaysPerLevel * 1.5, 18)
  const conservative = addDays(now, Math.round(conservativePace * levelsRemaining))

  // Format excluded levels for display
  const excludedLevels = analysis.excludedLevels.map(level => ({
    level: level.level,
    days: level.days,
    reason: 'Auto-detected break (statistical outlier)',
  }))

  return {
    expected,
    fastTrack,
    conservative,
    averageDaysPerLevel: Math.round(averageDaysPerLevel * 10) / 10,
    medianDaysPerLevel,
    outlierThreshold: analysis.outlierThreshold,
    fastestLevel,
    slowestLevel,
    excludedLevels,
  }
}

/**
 * Calculate milestone dates (levels 30, 40, 50, 60)
 */
export function calculateMilestones(
  currentLevel: number,
  averageDaysPerLevel: number
): Array<{ level: number; date: Date; status: 'completed' | 'upcoming' }> {
  const milestones = [30, 40, 50, 60]
  const now = new Date()

  return milestones.map((level) => {
    if (level <= currentLevel) {
      return {
        level,
        date: now,
        status: 'completed' as const,
      }
    } else {
      const levelsToGo = level - currentLevel
      const daysToGo = levelsToGo * averageDaysPerLevel
      return {
        level,
        date: addDays(now, Math.round(daysToGo)),
        status: 'upcoming' as const,
      }
    }
  })
}
