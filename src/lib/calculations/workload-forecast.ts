// Workload Forecast Calculations
import { addHours, addDays, startOfDay, format, endOfWeek, startOfWeek, isSameWeek } from 'date-fns'
import type { Assignment, ReviewStatistic } from '@/lib/api/types'
import {
  getNextReviewInterval,
  getNextStageOnCorrect,
  getNextStageOnIncorrect,
  isActiveStage,
} from './srs-intervals'
import { SeededRandom, createForecastSeed } from '@/lib/utils/seeded-random'

export interface DailyForecast {
  date: Date
  existingReviews: number // Reviews from current items
  newLessonReviews: number // Reviews from simulated lessons
  totalReviews: number
}

export interface WeeklyForecast {
  weekNumber: number
  startDate: Date
  endDate: Date
  existingReviews: number
  newLessonReviews: number
  totalReviews: number
  dailyAverage: number
}

export interface WorkloadMetrics {
  peakDay: {
    date: Date
    count: number
    dayIndex: number
  }
  stabilizationDay: {
    date: Date
    dayIndex: number
  } | null
  totalReviews: number
  averageDaily: number
  maxDaily: number
  minDaily: number
}

export interface WorkloadBreakdown {
  fromExisting: number
  fromNewLessons: number
  existingPercentage: number
  newLessonsPercentage: number
}

export interface WorkloadForecastResult {
  dailyForecast: DailyForecast[]
  metrics: WorkloadMetrics
  breakdown: WorkloadBreakdown
}

export interface WorkloadForecastInput {
  assignments: Assignment[]
  reviewStatistics: ReviewStatistic[]
  lessonsPerDay: number
  forecastDays?: number
  userId: string
}

/**
 * Calculate user's overall accuracy rate from review statistics
 * Returns a value between 0 and 1
 * Defaults to 0.85 (85%) if no statistics available
 */
function calculateUserAccuracy(reviewStats: ReviewStatistic[]): number {
  if (!reviewStats || reviewStats.length === 0) return 0.85

  let totalCorrect = 0
  let totalIncorrect = 0

  for (const stat of reviewStats) {
    if (stat.hidden) continue
    totalCorrect += stat.meaning_correct + stat.reading_correct
    totalIncorrect += stat.meaning_incorrect + stat.reading_incorrect
  }

  const total = totalCorrect + totalIncorrect
  if (total === 0) return 0.85

  return totalCorrect / total
}

/**
 * Simulate a single item's review path over time, adding reviews to daily buckets
 */
function projectItemReviews(
  startDate: Date,
  initialStage: number,
  userAccuracy: number,
  dailyBuckets: Map<string, { existing: number; newLessons: number }>,
  forecastEndDate: Date,
  isNewLesson: boolean,
  rng: SeededRandom
) {
  let currentDate = new Date(startDate)
  let currentStage = initialStage

  // Limit iterations to prevent infinite loops
  let iterations = 0
  const maxIterations = 100

  while (currentDate < forecastEndDate && currentStage < 9 && iterations < maxIterations) {
    iterations++

    // Add review to the appropriate day bucket
    const dayKey = format(startOfDay(currentDate), 'yyyy-MM-dd')
    if (!dailyBuckets.has(dayKey)) {
      dailyBuckets.set(dayKey, { existing: 0, newLessons: 0 })
    }

    const bucket = dailyBuckets.get(dayKey)!
    if (isNewLesson) {
      bucket.newLessons++
    } else {
      bucket.existing++
    }

    // Determine if user passes or fails (deterministic based on seed)
    const passes = rng.next() < userAccuracy

    if (passes) {
      // Correct answer: move to next stage
      currentStage = getNextStageOnCorrect(currentStage)
    } else {
      // Incorrect answer: drop stages
      currentStage = getNextStageOnIncorrect(currentStage)
    }

    // Stop if burned or at initiate
    if (currentStage === 0 || currentStage === 9) break

    // Schedule next review based on new stage
    const intervalHours = getNextReviewInterval(currentStage)
    if (intervalHours === 0) break

    currentDate = addHours(currentDate, intervalHours)
  }
}

/**
 * Calculate stabilization point: when 7-day rolling variance drops below 15% of mean
 * Returns the day index (0-based) or null if no stabilization found
 */
function calculateStabilizationPoint(dailyForecast: DailyForecast[]): number | null {
  const windowSize = 7
  const varianceThreshold = 0.15 // 15% of mean

  for (let i = windowSize - 1; i < dailyForecast.length; i++) {
    // Get 7-day window
    const window = dailyForecast.slice(i - windowSize + 1, i + 1)
    const counts = window.map((d) => d.totalReviews)

    // Calculate mean
    const mean = counts.reduce((sum, val) => sum + val, 0) / windowSize

    // Skip if mean is very low (< 10 reviews) as it's not meaningful
    if (mean < 10) continue

    // Calculate standard deviation
    const squareDiffs = counts.map((val) => Math.pow(val - mean, 2))
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / windowSize
    const stdDev = Math.sqrt(variance)

    // Check if variance is below threshold
    if (stdDev / mean < varianceThreshold) {
      return i
    }
  }

  return null
}

/**
 * Calculate 30-day workload forecast
 */
export function calculateWorkloadForecast(
  input: WorkloadForecastInput
): WorkloadForecastResult {
  const { assignments, reviewStatistics, lessonsPerDay, forecastDays = 30, userId } = input

  // Calculate user's accuracy rate
  const userAccuracy = calculateUserAccuracy(reviewStatistics)

  // Create deterministic RNG for consistent forecasts
  const now = new Date()
  const seed = createForecastSeed(userId, now, lessonsPerDay)
  const rng = new SeededRandom(seed)

  // Initialize daily buckets
  const dailyBuckets = new Map<string, { existing: number; newLessons: number }>()

  const forecastEndDate = addDays(startOfDay(now), forecastDays)

  // Project existing assignments
  for (const assignment of assignments) {
    // Skip hidden, unstarted, and burned items
    if (assignment.hidden || !assignment.available_at) continue
    if (!isActiveStage(assignment.srs_stage)) continue

    const availableAt = new Date(assignment.available_at)

    // Only project items that have reviews in the forecast window
    if (availableAt < forecastEndDate) {
      projectItemReviews(
        availableAt,
        assignment.srs_stage,
        userAccuracy,
        dailyBuckets,
        forecastEndDate,
        false, // Not a new lesson
        rng
      )
    }
  }

  // Simulate new lessons - start from tomorrow (day 1) since user may have already done lessons today
  for (let dayOffset = 1; dayOffset <= forecastDays; dayOffset++) {
    const lessonDate = addDays(startOfDay(now), dayOffset)

    for (let i = 0; i < lessonsPerDay; i++) {
      // New lessons start at stage 1 (Apprentice I)
      projectItemReviews(
        lessonDate,
        1, // Start at Apprentice I
        userAccuracy,
        dailyBuckets,
        forecastEndDate,
        true, // Is a new lesson
        rng
      )
    }
  }

  // Convert buckets to daily forecast array
  const dailyForecast: DailyForecast[] = []
  for (let i = 0; i < forecastDays; i++) {
    const date = addDays(startOfDay(now), i)
    const dayKey = format(date, 'yyyy-MM-dd')
    const bucket = dailyBuckets.get(dayKey) || { existing: 0, newLessons: 0 }

    dailyForecast.push({
      date,
      existingReviews: bucket.existing,
      newLessonReviews: bucket.newLessons,
      totalReviews: bucket.existing + bucket.newLessons,
    })
  }

  // Calculate metrics
  const totalReviews = dailyForecast.reduce((sum, day) => sum + day.totalReviews, 0)
  const reviewCounts = dailyForecast.map((d) => d.totalReviews)
  const maxDaily = Math.max(...reviewCounts, 0)
  const minDaily = Math.min(...reviewCounts, 0)
  const averageDaily = totalReviews / forecastDays

  // Find peak day
  const peakDayIndex = reviewCounts.indexOf(maxDaily)
  const peakDay = {
    date: dailyForecast[peakDayIndex]?.date || now,
    count: maxDaily,
    dayIndex: peakDayIndex,
  }

  // Find stabilization point
  const stabilizationIndex = calculateStabilizationPoint(dailyForecast)
  const stabilizationDay = stabilizationIndex !== null
    ? {
        date: dailyForecast[stabilizationIndex].date,
        dayIndex: stabilizationIndex,
      }
    : null

  // Calculate breakdown
  const totalExisting = dailyForecast.reduce((sum, day) => sum + day.existingReviews, 0)
  const totalNewLessons = dailyForecast.reduce((sum, day) => sum + day.newLessonReviews, 0)
  const breakdown: WorkloadBreakdown = {
    fromExisting: totalExisting,
    fromNewLessons: totalNewLessons,
    existingPercentage: totalReviews > 0 ? Math.round((totalExisting / totalReviews) * 100) : 0,
    newLessonsPercentage: totalReviews > 0 ? Math.round((totalNewLessons / totalReviews) * 100) : 0,
  }

  return {
    dailyForecast,
    metrics: {
      peakDay,
      stabilizationDay,
      totalReviews,
      averageDaily: Math.round(averageDaily),
      maxDaily,
      minDaily,
    },
    breakdown,
  }
}

/**
 * Aggregate daily forecasts into weekly buckets
 * Groups days into 7-day weeks and sums reviews
 */
export function aggregateToWeekly(dailyForecast: DailyForecast[]): WeeklyForecast[] {
  if (dailyForecast.length === 0) return []

  const weeklyData: WeeklyForecast[] = []
  let currentWeek: {
    days: DailyForecast[]
    startDate: Date
  } | null = null

  for (const day of dailyForecast) {
    // Start a new week if needed
    if (!currentWeek || !isSameWeek(day.date, currentWeek.startDate, { weekStartsOn: 0 })) {
      // Save previous week if exists
      if (currentWeek && currentWeek.days.length > 0) {
        const totalExisting = currentWeek.days.reduce((sum, d) => sum + d.existingReviews, 0)
        const totalNew = currentWeek.days.reduce((sum, d) => sum + d.newLessonReviews, 0)
        const total = totalExisting + totalNew

        weeklyData.push({
          weekNumber: weeklyData.length + 1,
          startDate: startOfWeek(currentWeek.startDate, { weekStartsOn: 0 }),
          endDate: endOfWeek(currentWeek.startDate, { weekStartsOn: 0 }),
          existingReviews: totalExisting,
          newLessonReviews: totalNew,
          totalReviews: total,
          dailyAverage: Math.round(total / currentWeek.days.length),
        })
      }

      // Start new week
      currentWeek = {
        days: [day],
        startDate: day.date,
      }
    } else {
      // Add to current week
      currentWeek.days.push(day)
    }
  }

  // Save final week
  if (currentWeek && currentWeek.days.length > 0) {
    const totalExisting = currentWeek.days.reduce((sum, d) => sum + d.existingReviews, 0)
    const totalNew = currentWeek.days.reduce((sum, d) => sum + d.newLessonReviews, 0)
    const total = totalExisting + totalNew

    weeklyData.push({
      weekNumber: weeklyData.length + 1,
      startDate: startOfWeek(currentWeek.startDate, { weekStartsOn: 0 }),
      endDate: endOfWeek(currentWeek.startDate, { weekStartsOn: 0 }),
      existingReviews: totalExisting,
      newLessonReviews: totalNew,
      totalReviews: total,
      dailyAverage: Math.round(total / currentWeek.days.length),
    })
  }

  return weeklyData
}
