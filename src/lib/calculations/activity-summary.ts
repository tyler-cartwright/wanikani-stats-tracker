// Aggregate totals over the captured activity history: lifetime (or per-year)
// review/lesson counts, busiest day, and tracking-coverage facts the UI needs
// to present the forward-only history honestly.
import type { ActivityDayRow } from '@/lib/db/schema'
import { isActiveDay } from './daily-streaks'

export interface BusiestDay {
  date: string
  reviews: number
  lessons: number
  total: number
}

export interface ActivitySummary {
  totalReviews: number // all four answer facets summed
  totalLessons: number
  activeDays: number // days with any activity
  trackedDays: number // rows present (idle days have zero rows too)
  busiestDay: BusiestDay | null // ties resolve to the earliest date
  firstDate: string | null
  lastDate: string | null
  hasBaselineDays: boolean
}

export function countDayReviews(row: ActivityDayRow): number {
  const { meaningCorrect, meaningIncorrect, readingCorrect, readingIncorrect } = row.reviews
  return meaningCorrect + meaningIncorrect + readingCorrect + readingIncorrect
}

export function summarizeActivity(history: ActivityDayRow[]): ActivitySummary {
  let totalReviews = 0
  let totalLessons = 0
  let activeDays = 0
  let busiestDay: BusiestDay | null = null
  let firstDate: string | null = null
  let lastDate: string | null = null
  let hasBaselineDays = false

  for (const row of history) {
    const reviews = countDayReviews(row)
    const total = reviews + row.lessons

    totalReviews += reviews
    totalLessons += row.lessons
    if (isActiveDay(row)) activeDays++
    if (row.baseline) hasBaselineDays = true
    if (!firstDate || row.date < firstDate) firstDate = row.date
    if (!lastDate || row.date > lastDate) lastDate = row.date

    if (total > 0 && (!busiestDay || total > busiestDay.total ||
        (total === busiestDay.total && row.date < busiestDay.date))) {
      busiestDay = { date: row.date, reviews, lessons: row.lessons, total }
    }
  }

  return {
    totalReviews,
    totalLessons,
    activeDays,
    trackedDays: history.length,
    busiestDay,
    firstDate,
    lastDate,
    hasBaselineDays,
  }
}

// String-prefix match — no Date parsing, no timezone hazard
export function filterToYear(history: ActivityDayRow[], year: number): ActivityDayRow[] {
  const prefix = `${year}-`
  return history.filter((row) => row.date.startsWith(prefix))
}

// Distinct years present in the history, most recent first
export function listAvailableYears(history: ActivityDayRow[]): number[] {
  const years = new Set<number>()
  for (const row of history) {
    years.add(Number(row.date.slice(0, 4)))
  }
  return [...years].sort((a, b) => b - a)
}
