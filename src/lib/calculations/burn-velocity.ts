// Burn Velocity Calculations
import { subDays, isWithinInterval, addDays } from 'date-fns'
import type { Assignment, Subject } from '@/lib/api/types'

export interface BurnPeriod {
  count: number // Number of burns in this period
  rate: number // Burns per day
}

export interface BurnVelocity {
  totalBurned: number
  totalItems: number
  burnPercentage: number

  // Period-based velocity
  last7Days: BurnPeriod
  last30Days: BurnPeriod
  last90Days: BurnPeriod

  // Trend comparison (current vs previous period)
  trend7Days: 'up' | 'down' | 'stable'
  trend30Days: 'up' | 'down' | 'stable'

  // Projection
  projectedBurnDate: Date | null // When all items will be burned at current pace
  daysToComplete: number | null
}

/**
 * Calculate burn velocity metrics
 */
export function calculateBurnVelocity(
  assignments: Assignment[],
  subjects: Array<Subject & { id: number }>
): BurnVelocity {
  const now = new Date()

  // Count total items and burned items
  const totalItems = subjects.filter((s) => !s.hidden_at).length
  const burnedAssignments = assignments.filter((a) => a.burned_at && !a.hidden)

  const totalBurned = burnedAssignments.length
  const burnPercentage = totalItems > 0 ? (totalBurned / totalItems) * 100 : 0

  // Calculate burns for different periods
  const last7Days = calculateBurnPeriod(burnedAssignments, now, 7)
  const last30Days = calculateBurnPeriod(burnedAssignments, now, 30)
  const last90Days = calculateBurnPeriod(burnedAssignments, now, 90)

  // Calculate previous periods for trend comparison
  const prev7Days = calculateBurnPeriod(burnedAssignments, subDays(now, 7), 7)
  const prev30Days = calculateBurnPeriod(burnedAssignments, subDays(now, 30), 30)

  // Determine trends
  const trend7Days = calculateTrend(last7Days.rate, prev7Days.rate)
  const trend30Days = calculateTrend(last30Days.rate, prev30Days.rate)

  // Project completion date based on 30-day average
  let projectedBurnDate: Date | null = null
  let daysToComplete: number | null = null

  if (last30Days.rate > 0) {
    const remaining = totalItems - totalBurned
    daysToComplete = Math.ceil(remaining / last30Days.rate)
    projectedBurnDate = addDays(now, daysToComplete)
  }

  return {
    totalBurned,
    totalItems,
    burnPercentage,
    last7Days,
    last30Days,
    last90Days,
    trend7Days,
    trend30Days,
    projectedBurnDate,
    daysToComplete,
  }
}

/**
 * Calculate burn count and rate for a specific period
 */
function calculateBurnPeriod(
  burnedAssignments: Assignment[],
  endDate: Date,
  days: number
): BurnPeriod {
  const startDate = subDays(endDate, days)

  const count = burnedAssignments.filter((a) => {
    if (!a.burned_at) return false
    const burnedDate = new Date(a.burned_at)
    return isWithinInterval(burnedDate, { start: startDate, end: endDate })
  }).length

  const rate = count / days

  return { count, rate }
}

/**
 * Calculate trend by comparing current rate to previous rate
 * >10% change = up/down, otherwise stable
 */
function calculateTrend(
  currentRate: number,
  previousRate: number
): 'up' | 'down' | 'stable' {
  // If both rates are very low (< 0.1 per day), consider stable
  if (currentRate < 0.1 && previousRate < 0.1) {
    return 'stable'
  }

  // If previous rate was zero, any current rate is "up"
  if (previousRate === 0) {
    return currentRate > 0 ? 'up' : 'stable'
  }

  const percentChange = ((currentRate - previousRate) / previousRate) * 100

  if (percentChange > 10) return 'up'
  if (percentChange < -10) return 'down'
  return 'stable'
}
