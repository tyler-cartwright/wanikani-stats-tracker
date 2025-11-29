// Forecasting and Projection Calculations
import { addHours, addDays, addMonths, differenceInDays } from 'date-fns'
import type { Summary, LevelProgression } from '@/lib/api/types'

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
  fastestLevel: {
    level: number
    days: number
  }
  slowestLevel: {
    level: number
    days: number
  }
}

/**
 * Calculate review forecast from summary data
 */
export function calculateReviewForecast(summary: Summary): ReviewForecast {
  const now = new Date()

  // Count reviews by availability
  let current = 0
  let next2h = 0
  let next6h = 0
  let next12h = 0
  let next24h = 0

  // Also track by hour for visualization
  const reviewsByHour = new Map<number, number>()

  for (const review of summary.reviews) {
    const availableAt = new Date(review.available_at)
    const msFromNow = availableAt.getTime() - now.getTime()
    const hoursFromNow = msFromNow / (1000 * 60 * 60)
    const count = review.subject_ids.length

    // Count cumulative totals based on actual availability time
    if (msFromNow <= 0) {
      // Already available
      current += count
      next2h += count
      next6h += count
      next12h += count
      next24h += count
    } else if (hoursFromNow < 2) {
      next2h += count
      next6h += count
      next12h += count
      next24h += count
    } else if (hoursFromNow < 6) {
      next6h += count
      next12h += count
      next24h += count
    } else if (hoursFromNow < 12) {
      next12h += count
      next24h += count
    } else if (hoursFromNow < 24) {
      next24h += count
    }

    // For visualization, bucket by hour
    const hourBucket = msFromNow <= 0 ? 0 : Math.floor(hoursFromNow)
    if (hourBucket < 24) {
      const currentCount = reviewsByHour.get(hourBucket) || 0
      reviewsByHour.set(hourBucket, currentCount + count)
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
 */
export function projectLevel60Date(
  currentLevel: number,
  levelProgressions: LevelProgression[]
): Level60Projection {
  if (currentLevel >= 60) {
    // Already at max level
    return {
      expected: new Date(),
      fastTrack: new Date(),
      conservative: new Date(),
      averageDaysPerLevel: 0,
      medianDaysPerLevel: 0,
      fastestLevel: { level: 60, days: 0 },
      slowestLevel: { level: 60, days: 0 },
    }
  }

  // Calculate days per level for completed levels
  const levelDurations: Array<{ level: number; days: number }> = []

  for (const progression of levelProgressions) {
    if (progression.passed_at && progression.unlocked_at) {
      const unlockedDate = new Date(progression.unlocked_at)
      const passedDate = new Date(progression.passed_at)
      const days = differenceInDays(passedDate, unlockedDate)

      if (days >= 0) {
        levelDurations.push({
          level: progression.level,
          days,
        })
      }
    }
  }

  if (levelDurations.length === 0) {
    // No historical data, use default estimates
    const now = new Date()
    return {
      expected: addMonths(now, (60 - currentLevel) * 0.4), // ~12 days/level
      fastTrack: addMonths(now, (60 - currentLevel) * 0.27), // ~8 days/level
      conservative: addMonths(now, (60 - currentLevel) * 0.6), // ~18 days/level
      averageDaysPerLevel: 12,
      medianDaysPerLevel: 12,
      fastestLevel: { level: currentLevel, days: 8 },
      slowestLevel: { level: currentLevel, days: 18 },
    }
  }

  // Calculate average days per level
  const totalDays = levelDurations.reduce((sum, item) => sum + item.days, 0)
  const averageDaysPerLevel = totalDays / levelDurations.length

  // Calculate median
  const sortedDurations = [...levelDurations].sort((a, b) => a.days - b.days)
  const medianDaysPerLevel =
    sortedDurations[Math.floor(sortedDurations.length / 2)].days

  // Find fastest and slowest
  const fastestLevel = sortedDurations[0]
  const slowestLevel = sortedDurations[sortedDurations.length - 1]

  // Calculate projections
  const levelsRemaining = 60 - currentLevel
  const now = new Date()

  const expected = addDays(now, Math.round(averageDaysPerLevel * levelsRemaining))

  // Fast track: 8 days per level (WK speed run pace)
  const fastTrack = addDays(now, 8 * levelsRemaining)

  // Conservative: Use 90th percentile or average * 1.5
  const conservativePace = Math.max(averageDaysPerLevel * 1.5, 18)
  const conservative = addDays(now, Math.round(conservativePace * levelsRemaining))

  return {
    expected,
    fastTrack,
    conservative,
    averageDaysPerLevel: Math.round(averageDaysPerLevel * 10) / 10,
    medianDaysPerLevel,
    fastestLevel,
    slowestLevel,
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
