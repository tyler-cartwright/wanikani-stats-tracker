import { describe, expect, it } from 'vitest'
import { makeActivityDayRow } from '@/lib/test/fixtures'
import { calculateDailyStreaks, isActiveDay } from './daily-streaks'

const TODAY = '2026-06-10'

// An active day with default activity on the given date
function activeDay(date: string, overrides: Parameters<typeof makeActivityDayRow>[0] = {}) {
  return makeActivityDayRow({ date, ...overrides })
}

// A row that exists (sync ran, SRS snapshot landed) but recorded no activity
function idleDay(date: string, overrides: Parameters<typeof makeActivityDayRow>[0] = {}) {
  return makeActivityDayRow({
    date,
    lessons: 0,
    reviews: { meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    ...overrides,
  })
}

describe('isActiveDay', () => {
  it('is true with any review answer', () => {
    expect(
      isActiveDay(
        idleDay('2026-06-01', { reviews: { meaningIncorrect: 1 } })
      )
    ).toBe(true)
  })

  it('is true with lessons only', () => {
    expect(isActiveDay(idleDay('2026-06-01', { lessons: 3 }))).toBe(true)
  })

  it('is false for a zero row (sync ran, nothing studied)', () => {
    expect(isActiveDay(idleDay('2026-06-01'))).toBe(false)
  })
})

describe('calculateDailyStreaks', () => {
  it('returns empty streaks for no history', () => {
    expect(calculateDailyStreaks([], TODAY)).toEqual({
      current: 0,
      currentIncludesToday: false,
      longest: 0,
      longestStart: null,
      longestEnd: null,
    })
  })

  it('counts a single active day today as a current streak of 1', () => {
    const streaks = calculateDailyStreaks([activeDay(TODAY)], TODAY)
    expect(streaks.current).toBe(1)
    expect(streaks.currentIncludesToday).toBe(true)
    expect(streaks.longest).toBe(1)
  })

  it('keeps the streak "current" when today has no activity yet (today-grace)', () => {
    const streaks = calculateDailyStreaks(
      [activeDay('2026-06-08'), activeDay('2026-06-09')],
      TODAY
    )
    expect(streaks.current).toBe(2)
    expect(streaks.currentIncludesToday).toBe(false)
  })

  it('ignores a zero-activity row for today when applying today-grace', () => {
    const streaks = calculateDailyStreaks(
      [activeDay('2026-06-09'), idleDay(TODAY)],
      TODAY
    )
    expect(streaks.current).toBe(1)
    expect(streaks.currentIncludesToday).toBe(false)
  })

  it('zeroes the current streak when the last activity was before yesterday', () => {
    const streaks = calculateDailyStreaks([activeDay('2026-06-08')], TODAY)
    expect(streaks.current).toBe(0)
    expect(streaks.currentIncludesToday).toBe(false)
    // ...but it still counts toward longest
    expect(streaks.longest).toBe(1)
  })

  it('breaks runs on gaps and reports the longest with its bounds', () => {
    const streaks = calculateDailyStreaks(
      [
        // 5-day run last month
        activeDay('2026-05-01'),
        activeDay('2026-05-02'),
        activeDay('2026-05-03'),
        activeDay('2026-05-04'),
        activeDay('2026-05-05'),
        // 2-day current run
        activeDay('2026-06-09'),
        activeDay(TODAY),
      ],
      TODAY
    )
    expect(streaks.current).toBe(2)
    expect(streaks.longest).toBe(5)
    expect(streaks.longestStart).toBe('2026-05-01')
    expect(streaks.longestEnd).toBe('2026-05-05')
  })

  it('treats a zero-activity day in the middle as a gap', () => {
    const streaks = calculateDailyStreaks(
      [activeDay('2026-06-07'), idleDay('2026-06-08'), activeDay('2026-06-09')],
      TODAY
    )
    expect(streaks.current).toBe(1)
    expect(streaks.longest).toBe(1)
  })

  it('continues a streak across month and year boundaries', () => {
    const streaks = calculateDailyStreaks(
      [activeDay('2025-12-30'), activeDay('2025-12-31'), activeDay('2026-01-01')],
      '2026-01-01'
    )
    expect(streaks.current).toBe(3)
    expect(streaks.longest).toBe(3)
    expect(streaks.longestStart).toBe('2025-12-30')
    expect(streaks.longestEnd).toBe('2026-01-01')
  })

  it('counts a baseline day as active only when it recorded activity', () => {
    const withActivity = calculateDailyStreaks(
      [activeDay('2026-06-09', { baseline: true }), activeDay(TODAY)],
      TODAY
    )
    expect(withActivity.current).toBe(2)

    const withoutActivity = calculateDailyStreaks(
      [activeDay('2026-06-08'), idleDay('2026-06-09', { baseline: true }), activeDay(TODAY)],
      TODAY
    )
    expect(withoutActivity.current).toBe(1)
  })

  it('is order-independent (sorts defensively)', () => {
    const days = [
      activeDay('2026-06-09'),
      activeDay('2026-06-07'),
      activeDay('2026-06-08'),
    ]
    expect(calculateDailyStreaks(days, TODAY)).toEqual(
      calculateDailyStreaks([...days].reverse(), TODAY)
    )
    expect(calculateDailyStreaks(days, TODAY).current).toBe(3)
  })
})
