// GitHub-style year calendar grid for the activity heatmap.
//
// The grid is Sunday-first and spans the Sunday on/before Jan 1 through the
// Saturday on/after Dec 31 (53 or 54 week columns). All date stepping happens
// on local Dates stringified via formatLocalDate — 'YYYY-MM-DD' strings are
// never parsed with new Date(str), which would read them as UTC.
import type { ActivityDayRow } from '@/lib/db/schema'
import { formatLocalDate } from './activity-capture'
import { countDayReviews } from './activity-summary'

export type IntensityLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapCell {
  date: string
  inYear: boolean // padding cells before Jan 1 / after Dec 31
  isFuture: boolean // after `today` (only meaningful for the current year)
  total: number // reviews + lessons (0 when no row)
  reviews: number
  lessons: number
  hasRow: boolean // a row exists for this date (zero row vs never tracked)
  baseline: boolean
  level: IntensityLevel
}

export interface MonthLabel {
  weekIndex: number
  label: string // 'Jan' ... 'Dec'
}

export interface HeatmapGrid {
  weeks: HeatmapCell[][] // columns of 7 cells, Sunday first
  monthLabels: MonthLabel[]
  maxTotal: number
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Quartile cut points [q25, q50, q75, max] over the nonzero day totals.
// Quantiles (rather than a linear scale to max) keep a few huge days from
// flattening every normal day to the lightest shade. Monotone by construction
// even when the distribution is degenerate (all equal, fewer than 4 values).
export function computeIntensityThresholds(
  totals: number[]
): [number, number, number, number] {
  const nonzero = totals.filter((t) => t > 0).sort((a, b) => a - b)
  if (nonzero.length === 0) return [0, 0, 0, 0]

  const quantile = (q: number): number =>
    nonzero[Math.min(nonzero.length - 1, Math.floor(q * nonzero.length))]

  return [quantile(0.25), quantile(0.5), quantile(0.75), nonzero[nonzero.length - 1]]
}

// >= comparisons from the top so the busiest days always reach level 4 —
// with <= a year of identical days would render entirely in the lightest shade
function levelFor(total: number, thresholds: [number, number, number, number]): IntensityLevel {
  if (total <= 0) return 0
  if (total >= thresholds[2]) return 4
  if (total >= thresholds[1]) return 3
  if (total >= thresholds[0]) return 2
  return 1
}

export function buildHeatmapGrid(
  history: ActivityDayRow[],
  year: number,
  today: string
): HeatmapGrid {
  const byDate = new Map(history.map((row) => [row.date, row]))

  const yearTotals: number[] = []
  for (const row of history) {
    if (row.date.startsWith(`${year}-`)) {
      yearTotals.push(countDayReviews(row) + row.lessons)
    }
  }
  const thresholds = computeIntensityThresholds(yearTotals)

  // Walk from the Sunday on/before Jan 1 to the Saturday on/after Dec 31
  const cursor = new Date(year, 0, 1)
  cursor.setDate(cursor.getDate() - cursor.getDay())
  const yearEnd = new Date(year, 11, 31)

  const weeks: HeatmapCell[][] = []
  const monthLabels: MonthLabel[] = []
  let maxTotal = 0
  let week: HeatmapCell[] = []

  while (cursor <= yearEnd || week.length > 0) {
    const date = formatLocalDate(cursor)
    const inYear = cursor.getFullYear() === year
    const row = inYear ? byDate.get(date) : undefined
    const isFuture = inYear && date > today
    const reviews = row && !isFuture ? countDayReviews(row) : 0
    const lessons = row && !isFuture ? row.lessons : 0
    const total = reviews + lessons

    if (total > maxTotal) maxTotal = total

    // Label the week column containing each month's 1st
    if (inYear && cursor.getDate() === 1) {
      monthLabels.push({ weekIndex: weeks.length, label: MONTH_LABELS[cursor.getMonth()] })
    }

    week.push({
      date,
      inYear,
      isFuture,
      total,
      reviews,
      lessons,
      hasRow: !!row,
      baseline: !!row?.baseline,
      level: isFuture ? 0 : levelFor(total, thresholds),
    })

    if (week.length === 7) {
      weeks.push(week)
      week = []
      if (cursor >= yearEnd) break
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return { weeks, monthLabels, maxTotal }
}
