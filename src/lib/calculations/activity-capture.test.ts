import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeAssignment, makeReviewStatistic } from '@/lib/test/fixtures'
import type { ActivityDayRow } from '@/lib/db/schema'
import {
  buildSrsStageSnapshot,
  computeReviewDeltas,
  countNewLessons,
  formatLocalDate,
  mergeIntoDayRow,
} from './activity-capture'

const NOW = new Date(2026, 5, 10, 14, 30) // 2026-06-10 local

describe('formatLocalDate', () => {
  it('formats in local time with zero padding', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('uses the local calendar day, not UTC', () => {
    // 23:30 local on Jan 5 is Jan 6 in UTC for any timezone west of UTC,
    // and Jan 5 UTC for east — either way the local date must win.
    const lateEvening = new Date(2026, 0, 5, 23, 30)
    expect(formatLocalDate(lateEvening)).toBe('2026-01-05')
  })
})

describe('computeReviewDeltas', () => {
  it('returns zero deltas for empty input', () => {
    expect(computeReviewDeltas([])).toEqual({
      meaningCorrect: 0,
      meaningIncorrect: 0,
      readingCorrect: 0,
      readingIncorrect: 0,
    })
  })

  it('diffs each facet against the previous totals', () => {
    const previous = makeReviewStatistic({
      meaning_correct: 10,
      meaning_incorrect: 2,
      reading_correct: 8,
      reading_incorrect: 4,
    })
    const current = makeReviewStatistic({
      meaning_correct: 13,
      meaning_incorrect: 2,
      reading_correct: 9,
      reading_incorrect: 6,
    })

    expect(computeReviewDeltas([{ previous, current }])).toEqual({
      meaningCorrect: 3,
      meaningIncorrect: 0,
      readingCorrect: 1,
      readingIncorrect: 2,
    })
  })

  it('counts a brand-new statistic in full (new item reviewed since last delta sync)', () => {
    const current = makeReviewStatistic({
      meaning_correct: 2,
      meaning_incorrect: 1,
      reading_correct: 2,
      reading_incorrect: 0,
    })

    expect(computeReviewDeltas([{ current }])).toEqual({
      meaningCorrect: 2,
      meaningIncorrect: 1,
      readingCorrect: 2,
      readingIncorrect: 0,
    })
  })

  it('contributes nothing for unchanged items', () => {
    const stat = makeReviewStatistic({
      meaning_correct: 10,
      meaning_incorrect: 2,
      reading_correct: 8,
      reading_incorrect: 4,
    })

    expect(computeReviewDeltas([{ previous: stat, current: stat }])).toEqual({
      meaningCorrect: 0,
      meaningIncorrect: 0,
      readingCorrect: 0,
      readingIncorrect: 0,
    })
  })

  it('sums deltas across a mixed batch of items', () => {
    const changes = [
      {
        previous: makeReviewStatistic({ meaning_correct: 5 }),
        current: makeReviewStatistic({ meaning_correct: 7 }),
      },
      {
        current: makeReviewStatistic({ reading_correct: 1, reading_incorrect: 1 }),
      },
      {
        previous: makeReviewStatistic({ meaning_incorrect: 3 }),
        current: makeReviewStatistic({ meaning_incorrect: 4 }),
      },
    ]

    expect(computeReviewDeltas(changes)).toEqual({
      meaningCorrect: 2,
      meaningIncorrect: 1,
      readingCorrect: 1,
      readingIncorrect: 1,
    })
  })

  describe('negative deltas (corrupt baseline)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('clamps each facet to zero and warns instead of corrupting history', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const previous = makeReviewStatistic({
        meaning_correct: 10,
        reading_correct: 5,
      })
      const current = makeReviewStatistic({
        meaning_correct: 4, // went down — impossible on a sane baseline
        reading_correct: 6, // legitimate increase, must still count
      })

      expect(computeReviewDeltas([{ previous, current }])).toEqual({
        meaningCorrect: 0,
        meaningIncorrect: 0,
        readingCorrect: 1,
        readingIncorrect: 0,
      })
      expect(warn).toHaveBeenCalled()
    })
  })
})

describe('countNewLessons', () => {
  it('counts started_at transitioning from null to set', () => {
    const changes = [
      {
        previous: makeAssignment({ started_at: null }),
        current: makeAssignment({ started_at: '2026-06-10T10:00:00.000000Z' }),
      },
    ]
    expect(countNewLessons(changes)).toBe(1)
  })

  it('counts a brand-new assignment that already has started_at', () => {
    const changes = [
      { current: makeAssignment({ started_at: '2026-06-10T10:00:00.000000Z' }) },
    ]
    expect(countNewLessons(changes)).toBe(1)
  })

  it('does not count updates to an already-started assignment (SRS moves, resurrects)', () => {
    const changes = [
      {
        previous: makeAssignment({ started_at: '2026-01-01T00:00:00.000000Z', srs_stage: 2 }),
        current: makeAssignment({ started_at: '2026-01-01T00:00:00.000000Z', srs_stage: 3 }),
      },
    ]
    expect(countNewLessons(changes)).toBe(0)
  })

  it('does not count unlocks that have not been started', () => {
    const changes = [
      {
        previous: makeAssignment({ started_at: null }),
        current: makeAssignment({ started_at: null, unlocked_at: '2026-06-10T10:00:00.000000Z' }),
      },
      { current: makeAssignment({ started_at: null }) },
    ]
    expect(countNewLessons(changes)).toBe(0)
  })
})

describe('buildSrsStageSnapshot', () => {
  it('returns ten zeros for no assignments', () => {
    expect(buildSrsStageSnapshot([])).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('buckets counts by SRS stage 0..9', () => {
    const assignments = [
      makeAssignment({ srs_stage: 0 }),
      makeAssignment({ srs_stage: 1 }),
      makeAssignment({ srs_stage: 1 }),
      makeAssignment({ srs_stage: 5 }),
      makeAssignment({ srs_stage: 9 }),
      makeAssignment({ srs_stage: 9 }),
      makeAssignment({ srs_stage: 9 }),
    ]
    expect(buildSrsStageSnapshot(assignments)).toEqual([1, 2, 0, 0, 0, 1, 0, 0, 0, 3])
  })

  it('skips hidden and unstarted assignments (mirrors calculateSRSDistribution)', () => {
    const assignments = [
      makeAssignment({ srs_stage: 4, hidden: true }),
      makeAssignment({ srs_stage: 4, started_at: null }),
      makeAssignment({ srs_stage: 4 }),
    ]
    expect(buildSrsStageSnapshot(assignments)).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
  })
})

describe('mergeIntoDayRow', () => {
  const reviews = {
    meaningCorrect: 3,
    meaningIncorrect: 1,
    readingCorrect: 2,
    readingIncorrect: 0,
  }

  it('creates a fresh row when none exists for the date', () => {
    const row = mergeIntoDayRow(undefined, '2026-06-10', { reviews, lessons: 2 }, NOW)

    expect(row).toEqual({
      date: '2026-06-10',
      reviews,
      lessons: 2,
      srsSnapshot: null,
      updatedAt: NOW.toISOString(),
    })
  })

  it('accumulates reviews and lessons across same-day merges', () => {
    const first = mergeIntoDayRow(undefined, '2026-06-10', { reviews, lessons: 1 }, NOW)
    const later = new Date(2026, 5, 10, 18, 0)
    const second = mergeIntoDayRow(first, '2026-06-10', { reviews, lessons: 2 }, later)

    expect(second.reviews).toEqual({
      meaningCorrect: 6,
      meaningIncorrect: 2,
      readingCorrect: 4,
      readingIncorrect: 0,
    })
    expect(second.lessons).toBe(3)
    expect(second.updatedAt).toBe(later.toISOString())
  })

  it('replaces the SRS snapshot rather than summing it', () => {
    const first = mergeIntoDayRow(
      undefined,
      '2026-06-10',
      { srsSnapshot: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      NOW
    )
    const second = mergeIntoDayRow(
      first,
      '2026-06-10',
      { srsSnapshot: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0] },
      NOW
    )

    expect(second.srsSnapshot).toEqual([0, 2, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('keeps an existing snapshot when the merge provides none', () => {
    const first = mergeIntoDayRow(
      undefined,
      '2026-06-10',
      { srsSnapshot: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      NOW
    )
    const second = mergeIntoDayRow(first, '2026-06-10', { reviews }, NOW)

    expect(second.srsSnapshot).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('writes a zero-delta baseline row for a full (no-baseline) sync day', () => {
    const row = mergeIntoDayRow(undefined, '2026-06-10', { baselineEstablished: true }, NOW)

    expect(row.reviews).toEqual({
      meaningCorrect: 0,
      meaningIncorrect: 0,
      readingCorrect: 0,
      readingIncorrect: 0,
    })
    expect(row.lessons).toBe(0)
    expect(row.baseline).toBe(true)
  })

  it('preserves the baseline flag through later same-day merges', () => {
    const baselineRow = mergeIntoDayRow(
      undefined,
      '2026-06-10',
      { baselineEstablished: true },
      NOW
    )
    const merged = mergeIntoDayRow(baselineRow, '2026-06-10', { reviews, lessons: 1 }, NOW)

    expect(merged.baseline).toBe(true)
    expect(merged.reviews).toEqual(reviews)
  })

  it('leaves untouched facets alone on partial input (failed collection sync)', () => {
    const existing: ActivityDayRow = {
      date: '2026-06-10',
      reviews,
      lessons: 4,
      srsSnapshot: null,
      updatedAt: NOW.toISOString(),
    }

    const lessonsOnly = mergeIntoDayRow(existing, '2026-06-10', { lessons: 1 }, NOW)
    expect(lessonsOnly.reviews).toEqual(reviews)
    expect(lessonsOnly.lessons).toBe(5)

    const reviewsOnly = mergeIntoDayRow(existing, '2026-06-10', { reviews }, NOW)
    expect(reviewsOnly.lessons).toBe(4)
  })
})
