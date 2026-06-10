import { describe, expect, it } from 'vitest'
import { makeReviewStatistic } from '@/lib/test/fixtures'
import { calculateStreakRecords } from './streaks'

// A stat whose facets have answers, so both participate
function activeStat(overrides: Parameters<typeof makeReviewStatistic>[0] = {}) {
  return makeReviewStatistic({
    meaning_correct: 10,
    reading_correct: 10,
    ...overrides,
  })
}

describe('calculateStreakRecords', () => {
  it('returns empty records for no statistics', () => {
    expect(calculateStreakRecords([])).toEqual({
      longestEver: null,
      hotStreaks: [],
      recentlyBroken: [],
      totalOnHotStreak: 0,
    })
  })

  it('skips hidden items entirely', () => {
    const records = calculateStreakRecords([
      activeStat({ hidden: true, meaning_current_streak: 50, meaning_max_streak: 50 }),
    ])
    expect(records.longestEver).toBeNull()
    expect(records.hotStreaks).toEqual([])
  })

  it('excludes facets with no answers (radicals have no reading facet)', () => {
    const radical = makeReviewStatistic({
      subject_id: 7,
      subject_type: 'radical',
      meaning_correct: 30,
      meaning_current_streak: 30,
      meaning_max_streak: 30,
      // reading facet untouched: zero answers, zero streaks
    })

    const records = calculateStreakRecords([radical])

    expect(records.longestEver).toEqual({
      subjectId: 7,
      facet: 'meaning',
      currentStreak: 30,
      maxStreak: 30,
    })
    // No zero-streak reading entry leaked into broken/hot lists
    expect(records.recentlyBroken).toEqual([])
    expect(records.hotStreaks).toHaveLength(1)
  })

  it('tracks meaning and reading as separate entries for the same item', () => {
    const stat = activeStat({
      subject_id: 42,
      meaning_current_streak: 25,
      meaning_max_streak: 25,
      reading_current_streak: 21,
      reading_max_streak: 30,
    })

    const records = calculateStreakRecords([stat])

    expect(records.hotStreaks).toEqual([
      { subjectId: 42, facet: 'meaning', currentStreak: 25, maxStreak: 25 },
      { subjectId: 42, facet: 'reading', currentStreak: 21, maxStreak: 30 },
    ])
    expect(records.longestEver?.facet).toBe('reading')
    expect(records.longestEver?.maxStreak).toBe(30)
  })

  it('applies the hot threshold inclusively (20 in, 19 out)', () => {
    const records = calculateStreakRecords([
      activeStat({ subject_id: 1, meaning_current_streak: 20, meaning_max_streak: 20 }),
      activeStat({ subject_id: 2, meaning_current_streak: 19, meaning_max_streak: 19 }),
    ])

    expect(records.totalOnHotStreak).toBe(1)
    expect(records.hotStreaks[0].subjectId).toBe(1)
  })

  it('sorts hot streaks longest-first', () => {
    const records = calculateStreakRecords([
      activeStat({ subject_id: 1, meaning_current_streak: 22, meaning_max_streak: 22 }),
      activeStat({ subject_id: 2, meaning_current_streak: 40, meaning_max_streak: 40 }),
    ])

    expect(records.hotStreaks.map((s) => s.subjectId)).toEqual([2, 1])
  })

  it('flags recently broken streaks (current <= 1 after max >= 10)', () => {
    const records = calculateStreakRecords([
      // Just broke a long streak — at risk
      activeStat({ subject_id: 1, meaning_current_streak: 1, meaning_max_streak: 15 }),
      activeStat({ subject_id: 2, meaning_current_streak: 0, meaning_max_streak: 10 }),
      // Max too small to be notable
      activeStat({ subject_id: 3, meaning_current_streak: 1, meaning_max_streak: 9 }),
      // Recovering, not broken
      activeStat({ subject_id: 4, meaning_current_streak: 2, meaning_max_streak: 50 }),
    ])

    expect(records.recentlyBroken.map((s) => s.subjectId)).toEqual([1, 2])
  })

  it('sorts recently broken by biggest lost streak first', () => {
    const records = calculateStreakRecords([
      activeStat({ subject_id: 1, meaning_current_streak: 1, meaning_max_streak: 12 }),
      activeStat({ subject_id: 2, meaning_current_streak: 0, meaning_max_streak: 31 }),
    ])

    expect(records.recentlyBroken.map((s) => s.subjectId)).toEqual([2, 1])
  })

  it('honours custom thresholds', () => {
    const records = calculateStreakRecords(
      [activeStat({ subject_id: 1, meaning_current_streak: 5, meaning_max_streak: 5 })],
      { hotThreshold: 5, brokenMinMax: 3 }
    )

    expect(records.totalOnHotStreak).toBe(1)
  })
})
