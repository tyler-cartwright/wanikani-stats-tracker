import { describe, expect, it } from 'vitest'
import { calculateAccuracyMetrics } from './accuracy'
import { makeReviewStatistic, makeSubject } from '@/lib/test/fixtures'

describe('calculateAccuracyMetrics', () => {
  it('returns zeroed metrics for empty input', () => {
    const result = calculateAccuracyMetrics([], [])

    expect(result.overall).toBe(0)
    expect(result.meaning).toBe(0)
    expect(result.reading).toBe(0)
    expect(result.totalReviews).toBe(0)
    expect(result.counts.total).toEqual({ correct: 0, incorrect: 0, total: 0 })
    expect(result.byLevel.size).toBe(0)
  })

  it('weights overall accuracy by answer counts, not by item', () => {
    // Item A: 1/2 correct (50%), item B: 99/100 correct (99%).
    // Weighted: 100 correct / 102 answers = 98.04%, not the 74.5% item mean (bug #42).
    const subjects = [
      makeSubject({ id: 1, level: 1 }),
      makeSubject({ id: 2, level: 1 }),
    ]
    const stats = [
      makeReviewStatistic({ subject_id: 1, meaning_correct: 1, meaning_incorrect: 1 }),
      makeReviewStatistic({ subject_id: 2, meaning_correct: 99, meaning_incorrect: 1 }),
    ]

    const result = calculateAccuracyMetrics(stats, subjects)

    expect(result.overall).toBe(98.04)
    expect(result.counts.total).toEqual({ correct: 100, incorrect: 2, total: 102 })
  })

  it('splits meaning and reading accuracy and combines them in overall', () => {
    const subjects = [makeSubject({ id: 1, level: 3 })]
    const stats = [
      makeReviewStatistic({
        subject_id: 1,
        subject_type: 'kanji',
        meaning_correct: 8,
        meaning_incorrect: 2,
        reading_correct: 6,
        reading_incorrect: 4,
      }),
    ]

    const result = calculateAccuracyMetrics(stats, subjects)

    expect(result.meaning).toBe(80)
    expect(result.reading).toBe(60)
    expect(result.overall).toBe(70)
    expect(result.byLevel.get(3)).toEqual({ accuracy: 70, itemCount: 1 })
  })

  it('excludes hidden review statistics entirely', () => {
    const subjects = [makeSubject({ id: 1, level: 1 })]
    const stats = [
      makeReviewStatistic({
        subject_id: 1,
        meaning_correct: 5,
        meaning_incorrect: 5,
        hidden: true,
      }),
    ]

    const result = calculateAccuracyMetrics(stats, subjects)

    expect(result.totalReviews).toBe(0)
    expect(result.byLevel.size).toBe(0)
  })

  it('skips statistics with no matching subject', () => {
    const stats = [
      makeReviewStatistic({ subject_id: 999, meaning_correct: 10, meaning_incorrect: 0 }),
    ]

    const result = calculateAccuracyMetrics(stats, [])

    expect(result.totalReviews).toBe(0)
  })

  it('ignores reading fields on radicals', () => {
    // Radicals have no reading component; historical API data can still carry
    // non-zero reading counts, which must not pollute overall/reading totals.
    const subjects = [makeSubject({ id: 1, level: 1 })]
    const stats = [
      makeReviewStatistic({
        subject_id: 1,
        subject_type: 'radical',
        meaning_correct: 9,
        meaning_incorrect: 1,
        reading_correct: 5,
        reading_incorrect: 5,
      }),
    ]

    const result = calculateAccuracyMetrics(stats, subjects)

    expect(result.overall).toBe(90)
    expect(result.counts.reading.total).toBe(0)
    expect(result.byType.radicals.reading).toBeNull()
    expect(result.byType.radicals.meaning).toBe(90)
  })

  it('ignores reading fields on kana_vocabulary and buckets it under vocabulary', () => {
    const subjects = [makeSubject({ id: 1, level: 2 })]
    const stats = [
      makeReviewStatistic({
        subject_id: 1,
        subject_type: 'kana_vocabulary',
        meaning_correct: 7,
        meaning_incorrect: 3,
        reading_correct: 4,
        reading_incorrect: 6,
      }),
    ]

    const result = calculateAccuracyMetrics(stats, subjects)

    expect(result.overall).toBe(70)
    expect(result.counts.reading.total).toBe(0)
    expect(result.byType.vocabulary.meaning).toBe(70)
    expect(result.byType.vocabulary.overall).toBe(70)
  })
})
