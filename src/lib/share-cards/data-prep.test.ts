import { describe, expect, it } from 'vitest'
import {
  makeActivityDayRow,
  makeAssignment,
  makeLevelProgression,
} from '@/lib/test/fixtures'
import type { Milestone } from '@/lib/calculations/milestones'
import {
  buildLevelUpCardData,
  buildMilestoneCardData,
  buildYearInReviewCardData,
} from './data-prep'

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'burn-100',
    type: 'burn',
    label: '100 Burns',
    description: 'Burned 100 items',
    icon: 'Flame',
    achievedAt: new Date('2026-03-01T12:00:00Z'),
    target: 100,
    current: 120,
    isAchieved: true,
    ...overrides,
  }
}

describe('buildLevelUpCardData', () => {
  it('uses started_at as the reached date', () => {
    const card = buildLevelUpCardData(
      'crab',
      12,
      [
        makeLevelProgression({
          level: 12,
          started_at: '2026-06-01T09:00:00Z',
          unlocked_at: '2026-05-30T09:00:00Z',
        }),
      ],
      []
    )
    expect(card.reachedAt).toBe('2026-06-01T09:00:00Z')
  })

  it('falls back to unlocked_at then created_at', () => {
    const unlockedOnly = buildLevelUpCardData(
      'crab',
      12,
      [
        makeLevelProgression({
          level: 12,
          started_at: null,
          unlocked_at: '2026-05-30T09:00:00Z',
        }),
      ],
      []
    )
    expect(unlockedOnly.reachedAt).toBe('2026-05-30T09:00:00Z')

    const createdOnly = buildLevelUpCardData(
      'crab',
      12,
      [
        makeLevelProgression({
          level: 12,
          started_at: null,
          unlocked_at: null,
          created_at: '2026-05-29T09:00:00Z',
        }),
      ],
      []
    )
    expect(createdOnly.reachedAt).toBe('2026-05-29T09:00:00Z')
  })

  it('returns null reachedAt when the level has no progression', () => {
    expect(buildLevelUpCardData('crab', 12, [], []).reachedAt).toBeNull()
  })

  it('prefers the most recent progression after a reset', () => {
    const card = buildLevelUpCardData(
      'crab',
      12,
      [
        makeLevelProgression({
          level: 12,
          created_at: '2024-01-01T00:00:00Z',
          started_at: '2024-01-01T00:00:00Z',
        }),
        makeLevelProgression({
          level: 12,
          created_at: '2026-06-01T00:00:00Z',
          started_at: '2026-06-01T00:00:00Z',
        }),
      ],
      []
    )
    expect(card.reachedAt).toBe('2026-06-01T00:00:00Z')
  })

  it('counts passed and burned items, excluding hidden ones', () => {
    const card = buildLevelUpCardData(
      'crab',
      12,
      [],
      [
        makeAssignment({ subject_id: 1, passed_at: '2026-01-01T00:00:00Z' }),
        makeAssignment({
          subject_id: 2,
          passed_at: '2026-01-01T00:00:00Z',
          burned_at: '2026-05-01T00:00:00Z',
        }),
        makeAssignment({
          subject_id: 3,
          passed_at: '2026-01-01T00:00:00Z',
          hidden: true,
        }),
        makeAssignment({ subject_id: 4, passed_at: null }),
      ]
    )
    expect(card.stats.itemsPassed).toBe(2)
    expect(card.stats.itemsBurned).toBe(1)
  })

  it('computes days spent on the previous level', () => {
    const card = buildLevelUpCardData(
      'crab',
      12,
      [
        makeLevelProgression({
          level: 11,
          started_at: '2026-05-01T00:00:00Z',
          passed_at: '2026-05-11T00:00:00Z',
        }),
      ],
      []
    )
    expect(card.stats.daysOnPreviousLevel).toBe(10)
  })

  it('reports null previous-level days when the previous level never passed', () => {
    const card = buildLevelUpCardData(
      'crab',
      12,
      [makeLevelProgression({ level: 11, passed_at: null })],
      []
    )
    expect(card.stats.daysOnPreviousLevel).toBeNull()
  })
})

describe('buildMilestoneCardData', () => {
  it('maps milestone fields and lowercases known icons', () => {
    const card = buildMilestoneCardData('crab', makeMilestone({ icon: 'Star' }))
    expect(card).toMatchObject({
      kind: 'milestone',
      username: 'crab',
      label: '100 Burns',
      icon: 'star',
      achievedAt: '2026-03-01T12:00:00.000Z',
    })
  })

  it('falls back to the trophy icon for unknown icon names', () => {
    expect(buildMilestoneCardData('crab', makeMilestone({ icon: 'Sparkles' })).icon).toBe(
      'trophy'
    )
  })

  it('passes through a null achievedAt', () => {
    expect(
      buildMilestoneCardData('crab', makeMilestone({ achievedAt: null })).achievedAt
    ).toBeNull()
  })
})

describe('buildYearInReviewCardData', () => {
  const history = [
    makeActivityDayRow({ date: '2026-03-01', lessons: 5 }),
    makeActivityDayRow({ date: '2026-03-02', lessons: 0 }),
    // Different year — must be excluded from totals
    makeActivityDayRow({ date: '2025-12-31', lessons: 100 }),
  ]

  it('aggregates only the requested year', () => {
    const card = buildYearInReviewCardData('crab', 2026, history, [])
    expect(card.totalLessons).toBe(5)
    expect(card.activeDays).toBe(2)
    expect(card.totalReviews).toBe(48) // two days of default 24 answers
  })

  it('keeps the top 3 milestones of the year, most recent first', () => {
    const milestones = [
      makeMilestone({ id: 'a', label: 'A', achievedAt: new Date('2026-01-01T00:00:00Z') }),
      makeMilestone({ id: 'b', label: 'B', achievedAt: new Date('2026-04-01T00:00:00Z') }),
      makeMilestone({ id: 'c', label: 'C', achievedAt: new Date('2026-02-01T00:00:00Z') }),
      makeMilestone({ id: 'd', label: 'D', achievedAt: new Date('2026-03-01T00:00:00Z') }),
      // Wrong year and unachieved — both excluded
      makeMilestone({ id: 'e', label: 'E', achievedAt: new Date('2025-06-01T00:00:00Z') }),
      makeMilestone({ id: 'f', label: 'F', achievedAt: null }),
    ]
    const card = buildYearInReviewCardData('crab', 2026, history, milestones)
    expect(card.milestones).toEqual(['B', 'D', 'C'])
  })

  it('sets trackedFrom only when capture began partway through that year', () => {
    const midYearStart = [makeActivityDayRow({ date: '2026-06-09' })]
    expect(buildYearInReviewCardData('crab', 2026, midYearStart, []).trackedFrom).toBe(
      '2026-06-09'
    )

    // History reaching back into the previous year covered all of 2026
    expect(buildYearInReviewCardData('crab', 2026, history, []).trackedFrom).toBeNull()
  })

  it('builds an all-zero card from empty history', () => {
    const card = buildYearInReviewCardData('crab', 2026, [], [])
    expect(card).toMatchObject({
      totalReviews: 0,
      totalLessons: 0,
      activeDays: 0,
      longestStreak: 0,
      busiestDay: null,
      trackedFrom: null,
    })
  })
})
