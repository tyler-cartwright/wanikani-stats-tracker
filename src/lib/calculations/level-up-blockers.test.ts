import { describe, expect, it } from 'vitest'
import { calculateLevelUpBlockers, enrichBlockerItem } from './level-up-blockers'
import { calculateLevelProgress } from './level-progress'
import { makeAssignment, makeRadicalSubject, makeSubject } from '@/lib/test/fixtures'

const now = new Date('2026-06-12T00:00:00.000Z')
const hoursAfter = (h: number) => new Date(now.getTime() + h * 3_600_000)

describe('calculateLevelUpBlockers — earliest Guru walk', () => {
  it('stage 4 with a past available_at can Guru right now', () => {
    const subjects = [makeSubject({ id: 10 })]
    const assignments = [
      makeAssignment({
        subject_id: 10,
        srs_stage: 4,
        available_at: '2026-06-11T00:00:00.000Z',
      }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0].earliestGuruAt).toEqual(now)
    expect(result.earliestLevelUpAt).toEqual(now)
  })

  it('stage 4 with a future available_at gurus at that review', () => {
    const reviewAt = hoursAfter(5)
    const subjects = [makeSubject({ id: 10 })]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 4, available_at: reviewAt.toISOString() }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.blockers[0].earliestGuruAt).toEqual(reviewAt)
  })

  it('stage 1 walks the remaining intervals: first review + 8h + 23h + 47h', () => {
    const reviewAt = hoursAfter(2)
    const subjects = [makeSubject({ id: 10 })]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 1, available_at: reviewAt.toISOString() }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.blockers[0].earliestGuruAt).toEqual(hoursAfter(2 + 8 + 23 + 47))
  })

  it('unlocked with the lesson pending starts from a lesson now: 4+8+23+47h', () => {
    const subjects = [makeSubject({ id: 10 })]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 0, started_at: null, available_at: null }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.blockers[0].earliestGuruAt).toEqual(hoursAfter(82))
    expect(result.blockers[0].isLocked).toBe(false)
  })

  it('vacation mode (started, available_at null) reviews the moment vacation ends', () => {
    const subjects = [makeSubject({ id: 10 })]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 3, available_at: null }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    // Review now -> stage 4, then 47h to Guru
    expect(result.blockers[0].earliestGuruAt).toEqual(hoursAfter(47))
  })

  it('locked kanji waits for its slowest radical, then walks from its own lesson', () => {
    const subjects = [
      makeSubject({ id: 10, component_subject_ids: [20, 21] }),
      makeRadicalSubject({ id: 20 }),
      makeRadicalSubject({ id: 21 }),
    ]
    const assignments = [
      // No assignment for the kanji at all (locked)
      makeAssignment({ subject_id: 20, subject_type: 'radical', srs_stage: 5 }),
      makeAssignment({
        subject_id: 21,
        subject_type: 'radical',
        srs_stage: 3,
        available_at: hoursAfter(2).toISOString(),
      }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    // Radical 21: review at +2h -> stage 4, +47h -> Guru at +49h.
    // Kanji unlocks then: lesson + 82h.
    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0].isLocked).toBe(true)
    expect(result.blockers[0].srsStage).toBe(0)
    expect(result.blockers[0].earliestGuruAt).toEqual(hoursAfter(49 + 82))
  })

  it('locked kanji whose radicals are all Guru already unlocks now', () => {
    const subjects = [
      makeSubject({ id: 10, component_subject_ids: [20] }),
      makeRadicalSubject({ id: 20 }),
    ]
    const assignments = [
      makeAssignment({ subject_id: 20, subject_type: 'radical', srs_stage: 6 }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.blockers[0].earliestGuruAt).toEqual(hoursAfter(82))
  })
})

describe('calculateLevelUpBlockers — selection and agreement', () => {
  it('excludes already-Guru kanji from blockers and counts them as passed', () => {
    const subjects = [makeSubject({ id: 10 }), makeSubject({ id: 11 })]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 5 }),
      makeAssignment({ subject_id: 11, srs_stage: 4, available_at: hoursAfter(1).toISOString() }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.kanjiTotal).toBe(2)
    expect(result.kanjiPassed).toBe(1)
    expect(result.blockers.map((b) => b.subjectId)).toEqual([11])
  })

  it('ignores subjects hidden from the curriculum entirely', () => {
    const subjects = [
      makeSubject({ id: 10 }),
      makeSubject({ id: 11, hidden_at: '2025-01-01T00:00:00.000000Z' }),
    ]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 4 }),
      makeAssignment({ subject_id: 11, srs_stage: 1 }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.kanjiTotal).toBe(1)
    expect(result.blockers.map((b) => b.subjectId)).toEqual([10])
  })

  it('treats a hidden assignment as locked and agrees with calculateLevelProgress', () => {
    const subjects = [makeSubject({ id: 10 }), makeSubject({ id: 11 })]
    const assignments = [
      // Hidden assignment at Guru does NOT count as passed in level progress
      makeAssignment({ subject_id: 10, srs_stage: 6, hidden: true }),
      makeAssignment({ subject_id: 11, srs_stage: 5 }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)
    const progress = calculateLevelProgress(assignments, subjects, 1, 1)

    expect(result.kanjiNeeded).toBe(progress.kanjiNeededToLevelUp)
    expect(result.kanjiNeeded).toBe(1)
    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0].subjectId).toBe(10)
    expect(result.blockers[0].isLocked).toBe(true)
  })

  it('level-up date is the Nth-earliest Guru date; exactly N items are critical', () => {
    // 25 kanji: 20 passed, 5 pending -> need ceil(22.5) - 20 = 3 of the 5
    const subjects = Array.from({ length: 25 }, (_, i) => makeSubject({ id: 100 + i }))
    const assignments = [
      ...Array.from({ length: 20 }, (_, i) =>
        makeAssignment({ subject_id: 100 + i, srs_stage: 5 })
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeAssignment({
          subject_id: 120 + i,
          srs_stage: 4,
          available_at: hoursAfter(i + 1).toISOString(),
        })
      ),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.kanjiNeeded).toBe(3)
    expect(result.earliestLevelUpAt).toEqual(hoursAfter(3))
    expect(result.blockers.filter((b) => b.isCritical)).toHaveLength(3)
    expect(result.blockers.slice(0, 3).every((b) => b.isCritical)).toBe(true)
  })

  it('requirement already met: earliestLevelUpAt is null, leftovers are not critical', () => {
    // 10 kanji, 9 passed -> ceil(9) - 9 = 0 needed
    const subjects = Array.from({ length: 10 }, (_, i) => makeSubject({ id: 100 + i }))
    const assignments = [
      ...Array.from({ length: 9 }, (_, i) =>
        makeAssignment({ subject_id: 100 + i, srs_stage: 5 })
      ),
      makeAssignment({ subject_id: 109, srs_stage: 2 }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.kanjiNeeded).toBe(0)
    expect(result.earliestLevelUpAt).toBeNull()
    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0].isCritical).toBe(false)
  })

  it('only current-level kanji are blockers — not other levels, vocab, or radicals', () => {
    const subjects = [
      makeSubject({ id: 10 }),
      makeSubject({ id: 11, level: 2 }),
      // Vocabulary: readings without a type field
      makeSubject({ id: 12, readings: [] }),
      makeRadicalSubject({ id: 13 }),
    ]
    const assignments = [
      makeAssignment({ subject_id: 10, srs_stage: 4 }),
      makeAssignment({ subject_id: 11, srs_stage: 4 }),
      makeAssignment({ subject_id: 12, subject_type: 'vocabulary', srs_stage: 4 }),
      makeAssignment({ subject_id: 13, subject_type: 'radical', srs_stage: 4 }),
    ]

    const result = calculateLevelUpBlockers(assignments, subjects, 1, now)

    expect(result.kanjiTotal).toBe(1)
    expect(result.blockers.map((b) => b.subjectId)).toEqual([10])
  })
})

describe('enrichBlockerItem', () => {
  it('builds a full item even with no review statistic and no assignment', () => {
    const subjects = [makeSubject({ id: 10, component_subject_ids: [20] })]
    const result = calculateLevelUpBlockers([], subjects, 1, now)

    const item = enrichBlockerItem(result.blockers[0], subjects, [], [])

    expect(item).not.toBeNull()
    expect(item!.character).toBe('例')
    expect(item!.type).toBe('kanji')
    expect(item!.totalReviews).toBe(0)
    expect(item!.currentSRS).toBe(0)
    expect(item!.accuracy).toBe(100)
    expect(item!.meaningAccuracy).toBe(100)
  })

  it('returns null when the subject is missing', () => {
    const subjects = [makeSubject({ id: 10 })]
    const result = calculateLevelUpBlockers([], subjects, 1, now)

    expect(enrichBlockerItem(result.blockers[0], [], [], [])).toBeNull()
  })
})
