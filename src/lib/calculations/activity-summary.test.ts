import { describe, expect, it } from 'vitest'
import { makeActivityDayRow } from '@/lib/test/fixtures'
import {
  filterToYear,
  listAvailableYears,
  summarizeActivity,
} from './activity-summary'

function zeroDay(date: string) {
  return makeActivityDayRow({
    date,
    lessons: 0,
    reviews: { meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
  })
}

describe('summarizeActivity', () => {
  it('returns zeros and nulls for empty history', () => {
    expect(summarizeActivity([])).toEqual({
      totalReviews: 0,
      totalLessons: 0,
      activeDays: 0,
      trackedDays: 0,
      busiestDay: null,
      firstDate: null,
      lastDate: null,
      hasBaselineDays: false,
    })
  })

  it('sums all four review facets and lessons across days', () => {
    const summary = summarizeActivity([
      makeActivityDayRow({
        date: '2026-06-01',
        lessons: 5,
        reviews: { meaningCorrect: 10, meaningIncorrect: 2, readingCorrect: 9, readingIncorrect: 3 },
      }),
      makeActivityDayRow({
        date: '2026-06-02',
        lessons: 1,
        reviews: { meaningCorrect: 4, meaningIncorrect: 1, readingCorrect: 3, readingIncorrect: 0 },
      }),
    ])
    expect(summary.totalReviews).toBe(24 + 8)
    expect(summary.totalLessons).toBe(6)
  })

  it('distinguishes active days from tracked days', () => {
    const summary = summarizeActivity([
      makeActivityDayRow({ date: '2026-06-01' }),
      zeroDay('2026-06-02'),
      makeActivityDayRow({ date: '2026-06-03' }),
    ])
    expect(summary.activeDays).toBe(2)
    expect(summary.trackedDays).toBe(3)
  })

  it('finds the busiest day by reviews plus lessons', () => {
    const summary = summarizeActivity([
      makeActivityDayRow({
        date: '2026-06-01',
        lessons: 0,
        reviews: { meaningCorrect: 50, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
      }),
      makeActivityDayRow({
        date: '2026-06-02',
        lessons: 40,
        reviews: { meaningCorrect: 20, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
      }),
    ])
    expect(summary.busiestDay).toEqual({
      date: '2026-06-02',
      reviews: 20,
      lessons: 40,
      total: 60,
    })
  })

  it('resolves busiest-day ties to the earliest date', () => {
    const day = {
      lessons: 0,
      reviews: { meaningCorrect: 30, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    }
    const summary = summarizeActivity([
      makeActivityDayRow({ date: '2026-06-05', ...day }),
      makeActivityDayRow({ date: '2026-06-02', ...day }),
    ])
    expect(summary.busiestDay?.date).toBe('2026-06-02')
  })

  it('never reports a zero-activity day as busiest', () => {
    expect(summarizeActivity([zeroDay('2026-06-01')]).busiestDay).toBeNull()
  })

  it('reports first and last tracked dates and baseline presence', () => {
    const summary = summarizeActivity([
      makeActivityDayRow({ date: '2026-06-02' }),
      makeActivityDayRow({ date: '2026-06-01', baseline: true }),
      makeActivityDayRow({ date: '2026-06-03' }),
    ])
    expect(summary.firstDate).toBe('2026-06-01')
    expect(summary.lastDate).toBe('2026-06-03')
    expect(summary.hasBaselineDays).toBe(true)
  })
})

describe('filterToYear', () => {
  it('includes year boundaries and excludes adjacent years', () => {
    const history = [
      makeActivityDayRow({ date: '2025-12-31' }),
      makeActivityDayRow({ date: '2026-01-01' }),
      makeActivityDayRow({ date: '2026-12-31' }),
      makeActivityDayRow({ date: '2027-01-01' }),
    ]
    expect(filterToYear(history, 2026).map((r) => r.date)).toEqual([
      '2026-01-01',
      '2026-12-31',
    ])
  })
})

describe('listAvailableYears', () => {
  it('returns distinct years, most recent first', () => {
    const history = [
      makeActivityDayRow({ date: '2025-12-31' }),
      makeActivityDayRow({ date: '2026-01-01' }),
      makeActivityDayRow({ date: '2026-06-01' }),
    ]
    expect(listAvailableYears(history)).toEqual([2026, 2025])
  })

  it('returns an empty list for empty history', () => {
    expect(listAvailableYears([])).toEqual([])
  })
})
