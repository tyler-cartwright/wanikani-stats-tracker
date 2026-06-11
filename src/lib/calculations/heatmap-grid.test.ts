import { describe, expect, it } from 'vitest'
import { makeActivityDayRow } from '@/lib/test/fixtures'
import { parseLocalDate } from './activity-capture'
import { buildHeatmapGrid, computeIntensityThresholds } from './heatmap-grid'

const TODAY = '2026-06-10'

// A day whose total is exactly `total`, via lessons (keeps the math obvious)
function dayWithTotal(date: string, total: number, overrides: Parameters<typeof makeActivityDayRow>[0] = {}) {
  return makeActivityDayRow({
    date,
    lessons: total,
    reviews: { meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    ...overrides,
  })
}

describe('buildHeatmapGrid', () => {
  it('builds 53 Sunday-first weeks for 2026 (Jan 1 is a Thursday)', () => {
    const grid = buildHeatmapGrid([], 2026, TODAY)

    expect(grid.weeks).toHaveLength(53)
    // Week 0 runs Sun Dec 28 2025 .. Sat Jan 3 2026 — 4 padding cells
    expect(grid.weeks[0].filter((c) => !c.inYear)).toHaveLength(4)
    expect(grid.weeks[0][0].date).toBe('2025-12-28')
    expect(grid.weeks[0][4].date).toBe('2026-01-01')
    // Last week ends on a Saturday after Dec 31
    const lastWeek = grid.weeks[grid.weeks.length - 1]
    expect(lastWeek.some((c) => c.date === '2026-12-31')).toBe(true)
  })

  it('builds 54 weeks for 2028 (leap year starting on a Saturday)', () => {
    const grid = buildHeatmapGrid([], 2028, '2029-06-01')
    expect(grid.weeks).toHaveLength(54)
    expect(grid.weeks[0].filter((c) => !c.inYear)).toHaveLength(6)
  })

  it('places every cell on its actual local weekday', () => {
    const grid = buildHeatmapGrid([], 2026, TODAY)
    for (const week of grid.weeks) {
      expect(week).toHaveLength(7)
      week.forEach((cell, weekday) => {
        expect(parseLocalDate(cell.date).getDay()).toBe(weekday)
      })
    }
  })

  it('maps history rows to their cells with totals', () => {
    const grid = buildHeatmapGrid(
      [
        makeActivityDayRow({
          date: '2026-06-01',
          lessons: 5,
          reviews: { meaningCorrect: 10, meaningIncorrect: 2, readingCorrect: 9, readingIncorrect: 3 },
        }),
      ],
      2026,
      TODAY
    )
    const cell = grid.weeks.flat().find((c) => c.date === '2026-06-01')!
    expect(cell).toMatchObject({
      reviews: 24,
      lessons: 5,
      total: 29,
      hasRow: true,
      baseline: false,
    })
    expect(cell.level).toBeGreaterThan(0)
    expect(grid.maxTotal).toBe(29)
  })

  it('leaves untracked dates at level 0 with hasRow false', () => {
    const grid = buildHeatmapGrid([dayWithTotal('2026-06-01', 10)], 2026, TODAY)
    const cell = grid.weeks.flat().find((c) => c.date === '2026-03-15')!
    expect(cell).toMatchObject({ hasRow: false, total: 0, level: 0 })
  })

  it('flags dates after today as future at level 0', () => {
    const grid = buildHeatmapGrid([dayWithTotal('2026-06-01', 10)], 2026, TODAY)
    const future = grid.weeks.flat().filter((c) => c.inYear && c.date > TODAY)
    expect(future.length).toBeGreaterThan(0)
    expect(future.every((c) => c.isFuture && c.level === 0)).toBe(true)
    const past = grid.weeks.flat().find((c) => c.date === '2026-06-01')!
    expect(past.isFuture).toBe(false)
  })

  it('propagates the baseline flag to cells', () => {
    const grid = buildHeatmapGrid(
      [dayWithTotal('2026-06-01', 10, { baseline: true })],
      2026,
      TODAY
    )
    expect(grid.weeks.flat().find((c) => c.date === '2026-06-01')!.baseline).toBe(true)
  })

  it('assigns quartile intensity levels across the year', () => {
    const history = [10, 20, 30, 40, 50, 60, 70, 80].map((total, i) =>
      dayWithTotal(`2026-05-0${i + 1}`, total)
    )
    const grid = buildHeatmapGrid(history, 2026, TODAY)
    const levels = history.map(
      (row) => grid.weeks.flat().find((c) => c.date === row.date)!.level
    )
    expect(levels).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
  })

  it('gives a uniform year the strongest shade rather than the weakest', () => {
    const history = ['2026-05-01', '2026-05-02', '2026-05-03'].map((d) =>
      dayWithTotal(d, 25)
    )
    const grid = buildHeatmapGrid(history, 2026, TODAY)
    expect(grid.weeks.flat().find((c) => c.date === '2026-05-01')!.level).toBe(4)
  })

  it('ignores other years when computing intensity thresholds', () => {
    // A monster day in 2025 must not flatten 2026's shading
    const history = [dayWithTotal('2025-12-01', 1000), dayWithTotal('2026-05-01', 10)]
    const grid = buildHeatmapGrid(history, 2026, TODAY)
    expect(grid.weeks.flat().find((c) => c.date === '2026-05-01')!.level).toBe(4)
  })

  it('labels each month at the week containing its 1st', () => {
    const grid = buildHeatmapGrid([], 2026, TODAY)
    expect(grid.monthLabels).toHaveLength(12)
    expect(grid.monthLabels[0]).toEqual({ weekIndex: 0, label: 'Jan' })
    // Feb 1 2026 is 35 days after grid start (Sun Dec 28) → week 5
    expect(grid.monthLabels[1]).toEqual({ weekIndex: 5, label: 'Feb' })
    expect(grid.monthLabels[11].label).toBe('Dec')
  })

  it('builds an all-zero grid from empty history', () => {
    const grid = buildHeatmapGrid([], 2026, TODAY)
    expect(grid.maxTotal).toBe(0)
    expect(grid.weeks.flat().every((c) => c.level === 0 && !c.hasRow)).toBe(true)
  })
})

describe('computeIntensityThresholds', () => {
  it('returns zeros when there are no nonzero totals', () => {
    expect(computeIntensityThresholds([])).toEqual([0, 0, 0, 0])
    expect(computeIntensityThresholds([0, 0])).toEqual([0, 0, 0, 0])
  })

  it('collapses to the single value for a one-value distribution', () => {
    expect(computeIntensityThresholds([25])).toEqual([25, 25, 25, 25])
  })

  it('stays monotone on skewed distributions', () => {
    const [q25, q50, q75, max] = computeIntensityThresholds([1, 1, 1, 1, 1, 1, 1, 500])
    expect(q25).toBeLessThanOrEqual(q50)
    expect(q50).toBeLessThanOrEqual(q75)
    expect(q75).toBeLessThanOrEqual(max)
    expect(max).toBe(500)
  })

  it('ignores zero days entirely (idle days must not dilute the scale)', () => {
    expect(computeIntensityThresholds([0, 0, 0, 40])).toEqual([40, 40, 40, 40])
  })
})
