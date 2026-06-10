import { describe, expect, it } from 'vitest'
import type { ActivityDayRow } from '@/lib/db/schema'
import { mergeActivityHistory, parseActivityImport } from './import-manager'

function makeDayRow(overrides: Partial<ActivityDayRow> = {}): ActivityDayRow {
  return {
    date: '2026-06-01',
    reviews: {
      meaningCorrect: 10,
      meaningIncorrect: 2,
      readingCorrect: 8,
      readingIncorrect: 1,
    },
    lessons: 3,
    srsSnapshot: null,
    updatedAt: '2026-06-01T20:00:00.000Z',
    ...overrides,
  }
}

describe('parseActivityImport', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseActivityImport('not json {')).toThrow(/valid JSON/)
  })

  it('rejects an envelope without activity history', () => {
    const file = JSON.stringify({ metadata: {}, data: { subjects: [] } })
    expect(() => parseActivityImport(file)).toThrow(/no activity history/)
  })

  it('rejects non-array activity history', () => {
    const file = JSON.stringify({ data: { activityHistory: { nope: true } } })
    expect(() => parseActivityImport(file)).toThrow(/not a list/)
  })

  it('reads rows from a full export envelope', () => {
    const row = makeDayRow()
    const file = JSON.stringify({ metadata: { version: '1.1' }, data: { activityHistory: [row] } })
    expect(parseActivityImport(file)).toEqual([row])
  })

  it('accepts a bare array of day rows', () => {
    const row = makeDayRow()
    expect(parseActivityImport(JSON.stringify([row]))).toEqual([row])
  })

  it('drops malformed rows but keeps valid ones', () => {
    const good = makeDayRow()
    const rows = [
      good,
      { ...makeDayRow(), date: 'June 1st' }, // bad date
      { ...makeDayRow(), reviews: undefined }, // missing reviews
      { ...makeDayRow(), lessons: 'three' }, // wrong type
      { ...makeDayRow(), srsSnapshot: [1, 2, 3] }, // wrong snapshot length
    ]
    expect(parseActivityImport(JSON.stringify(rows))).toEqual([good])
  })

  it('clamps negative counters to zero instead of rejecting the row', () => {
    const row = makeDayRow({
      reviews: { meaningCorrect: -5, meaningIncorrect: 1, readingCorrect: 0, readingIncorrect: 0 },
    })
    const [parsed] = parseActivityImport(JSON.stringify([row]))
    expect(parsed.reviews.meaningCorrect).toBe(0)
    expect(parsed.reviews.meaningIncorrect).toBe(1)
  })

  it('preserves the baseline flag and snapshot', () => {
    const row = makeDayRow({
      baseline: true,
      srsSnapshot: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    })
    const [parsed] = parseActivityImport(JSON.stringify([row]))
    expect(parsed.baseline).toBe(true)
    expect(parsed.srsSnapshot).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('mergeActivityHistory', () => {
  it('unions disjoint dates and sorts chronologically', () => {
    const existing = [makeDayRow({ date: '2026-06-02' })]
    const imported = [makeDayRow({ date: '2026-06-01' }), makeDayRow({ date: '2026-06-03' })]

    const { merged, summary } = mergeActivityHistory(existing, imported)

    expect(merged.map((r) => r.date)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03'])
    expect(summary).toEqual({
      daysInFile: 2,
      newDays: 2,
      conflictsKeptExisting: 0,
      conflictsTookImported: 0,
    })
  })

  it('keeps the row with the larger review total on a date conflict', () => {
    const small = makeDayRow({
      reviews: { meaningCorrect: 1, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    })
    const big = makeDayRow({
      reviews: { meaningCorrect: 50, meaningIncorrect: 5, readingCorrect: 40, readingIncorrect: 3 },
      lessons: 12,
    })

    // Imported bigger -> imported wins
    const importedWins = mergeActivityHistory([small], [big])
    expect(importedWins.merged[0].lessons).toBe(12)
    expect(importedWins.summary.conflictsTookImported).toBe(1)

    // Existing bigger -> existing kept
    const existingWins = mergeActivityHistory([big], [small])
    expect(existingWins.merged[0].lessons).toBe(12)
    expect(existingWins.summary.conflictsKeptExisting).toBe(1)
  })

  it('keeps the existing row on a tie (idempotent re-import)', () => {
    const local = makeDayRow({ updatedAt: '2026-06-01T10:00:00.000Z' })
    const fromFile = makeDayRow({ updatedAt: '2026-06-01T20:00:00.000Z' })

    const { merged, summary } = mergeActivityHistory([local], [fromFile])

    expect(merged[0].updatedAt).toBe('2026-06-01T10:00:00.000Z')
    expect(summary.conflictsKeptExisting).toBe(1)
  })

  it('is idempotent: importing the same file twice changes nothing', () => {
    const imported = [makeDayRow({ date: '2026-06-01' }), makeDayRow({ date: '2026-06-02' })]

    const first = mergeActivityHistory([], imported)
    const second = mergeActivityHistory(first.merged, imported)

    expect(second.merged).toEqual(first.merged)
    expect(second.summary.newDays).toBe(0)
  })

  it('backfills the SRS snapshot from the losing row', () => {
    const snapshot = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const winnerNoSnapshot = makeDayRow({
      reviews: { meaningCorrect: 99, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
      srsSnapshot: null,
    })
    const loserWithSnapshot = makeDayRow({ srsSnapshot: snapshot })

    const { merged } = mergeActivityHistory([loserWithSnapshot], [winnerNoSnapshot])

    expect(merged[0].reviews.meaningCorrect).toBe(99)
    expect(merged[0].srsSnapshot).toEqual(snapshot)
  })

  it('preserves the baseline flag from either side of a conflict', () => {
    const baselineRow = makeDayRow({ baseline: true })
    const biggerRow = makeDayRow({
      reviews: { meaningCorrect: 99, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    })

    const { merged } = mergeActivityHistory([baselineRow], [biggerRow])

    expect(merged[0].baseline).toBe(true)
    expect(merged[0].reviews.meaningCorrect).toBe(99)
  })
})
