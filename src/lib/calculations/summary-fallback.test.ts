import { describe, expect, it } from 'vitest'
import {
  countLessonsAvailable,
  countReviewsAvailable,
  getNextReviewAt,
} from './summary-fallback'
import { makeAssignment } from '@/lib/test/fixtures'

const NOW = new Date('2026-06-01T12:00:00.000Z')

describe('countLessonsAvailable', () => {
  it('counts unlocked, unstarted assignments', () => {
    const lesson = makeAssignment({
      srs_stage: 0,
      unlocked_at: '2026-05-30T00:00:00.000000Z',
      started_at: null,
      available_at: null,
    })

    expect(countLessonsAvailable([lesson, lesson])).toBe(2)
  })

  it('excludes hidden, started, and locked assignments', () => {
    const hidden = makeAssignment({
      srs_stage: 0,
      unlocked_at: '2026-05-30T00:00:00.000000Z',
      started_at: null,
      hidden: true,
    })
    const started = makeAssignment({
      srs_stage: 1,
      unlocked_at: '2026-05-30T00:00:00.000000Z',
      started_at: '2026-05-31T00:00:00.000000Z',
    })
    const locked = makeAssignment({ srs_stage: 0, unlocked_at: null, started_at: null })

    expect(countLessonsAvailable([hidden, started, locked])).toBe(0)
  })
})

describe('countReviewsAvailable', () => {
  it('counts started assignments whose review time has arrived, inclusive of now', () => {
    const due = makeAssignment({ srs_stage: 3, available_at: '2026-06-01T11:00:00.000Z' })
    const dueExactlyNow = makeAssignment({ srs_stage: 3, available_at: NOW.toISOString() })
    const notYetDue = makeAssignment({ srs_stage: 3, available_at: '2026-06-01T13:00:00.000Z' })

    expect(countReviewsAvailable([due, dueExactlyNow, notYetDue], NOW)).toBe(2)
  })

  it('excludes hidden, lesson-stage, burned, and unscheduled assignments', () => {
    const past = '2026-06-01T11:00:00.000Z'
    const hidden = makeAssignment({ srs_stage: 3, available_at: past, hidden: true })
    const lessonStage = makeAssignment({ srs_stage: 0, available_at: past })
    const burned = makeAssignment({ srs_stage: 9, available_at: past })
    const unscheduled = makeAssignment({ srs_stage: 3, available_at: null })

    expect(countReviewsAvailable([hidden, lessonStage, burned, unscheduled], NOW)).toBe(0)
  })
})

describe('getNextReviewAt', () => {
  it('returns the earliest future review time', () => {
    const later = makeAssignment({ srs_stage: 3, available_at: '2026-06-02T00:00:00.000Z' })
    const sooner = makeAssignment({ srs_stage: 5, available_at: '2026-06-01T15:00:00.000Z' })

    expect(getNextReviewAt([later, sooner], NOW)).toBe('2026-06-01T15:00:00.000Z')
  })

  it('ignores already-due, hidden, lesson-stage, burned, and unscheduled assignments', () => {
    const future = '2026-06-02T00:00:00.000Z'
    const alreadyDue = makeAssignment({ srs_stage: 3, available_at: '2026-06-01T11:00:00.000Z' })
    const dueExactlyNow = makeAssignment({ srs_stage: 3, available_at: NOW.toISOString() })
    const hidden = makeAssignment({ srs_stage: 3, available_at: future, hidden: true })
    const lessonStage = makeAssignment({ srs_stage: 0, available_at: future })
    const burned = makeAssignment({ srs_stage: 9, available_at: future })
    const unscheduled = makeAssignment({ srs_stage: 3, available_at: null })

    expect(
      getNextReviewAt(
        [alreadyDue, dueExactlyNow, hidden, lessonStage, burned, unscheduled],
        NOW
      )
    ).toBeNull()
  })

  it('returns null for an empty list', () => {
    expect(getNextReviewAt([], NOW)).toBeNull()
  })
})
