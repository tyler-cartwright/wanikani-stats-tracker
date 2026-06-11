import { describe, expect, it } from 'vitest'
import { CARD_SIZE } from './theme'
import { layoutShareCard, truncateLabel, type DrawNode } from './layout'
import type { ShareCardData } from './types'

const levelUp: ShareCardData = {
  kind: 'level-up',
  username: 'crab',
  level: 23,
  reachedAt: '2026-06-11T09:00:00Z',
  stats: { itemsPassed: 4512, itemsBurned: 1847, daysOnPreviousLevel: 9 },
}

const milestone: ShareCardData = {
  kind: 'milestone',
  username: 'crab',
  label: '1,000 Burns',
  description: 'Burned 1,000 items',
  icon: 'flame',
  achievedAt: '2026-03-01T12:00:00Z',
}

const yearReview: ShareCardData = {
  kind: 'year-review',
  username: 'crab',
  year: 2026,
  totalReviews: 24863,
  totalLessons: 1204,
  activeDays: 297,
  longestStreak: 84,
  busiestDay: { date: '2026-02-14', total: 412 },
  milestones: ['Level 20', '1,000 Burns'],
  trackedFrom: null,
}

function texts(nodes: DrawNode[]): string[] {
  return nodes.filter((n) => n.type === 'text').map((n) => (n as { text: string }).text)
}

function assertInBounds(node: DrawNode) {
  if (node.type === 'rect') {
    expect(node.x).toBeGreaterThanOrEqual(0)
    expect(node.y).toBeGreaterThanOrEqual(0)
    expect(node.x + node.w).toBeLessThanOrEqual(CARD_SIZE)
    expect(node.y + node.h).toBeLessThanOrEqual(CARD_SIZE)
  } else if (node.type === 'text') {
    expect(node.x).toBeGreaterThanOrEqual(0)
    expect(node.x).toBeLessThanOrEqual(CARD_SIZE)
    expect(node.y).toBeGreaterThanOrEqual(0)
    expect(node.y).toBeLessThanOrEqual(CARD_SIZE)
  } else {
    for (const coord of [node.x1, node.y1, node.x2, node.y2]) {
      expect(coord).toBeGreaterThanOrEqual(0)
      expect(coord).toBeLessThanOrEqual(CARD_SIZE)
    }
  }
}

describe('layoutShareCard', () => {
  it.each([
    ['level-up', levelUp],
    ['milestone', milestone],
    ['year-review', yearReview],
  ] as const)('keeps every %s node within the canvas', (_kind, data) => {
    const nodes = layoutShareCard(data)
    expect(nodes.length).toBeGreaterThan(0)
    nodes.forEach(assertInBounds)
  })

  it('headlines each card kind correctly', () => {
    expect(texts(layoutShareCard(levelUp))).toContain('Level 23')
    expect(texts(layoutShareCard(milestone))).toContain('1,000 Burns')
    expect(texts(layoutShareCard(yearReview))).toContain('2026')
  })

  it('always includes the brand footer', () => {
    for (const data of [levelUp, milestone, yearReview]) {
      const t = texts(layoutShareCard(data))
      expect(t).toContain('🔥 WaniTrack')
      expect(t).toContain('wanitrack.com')
    }
  })

  it('shows the year-review stats and milestones', () => {
    const t = texts(layoutShareCard(yearReview))
    expect(t).toContain('24,863')
    expect(t).toContain('84 days')
    expect(t.some((s) => s.includes('Level 20 · 1,000 Burns'))).toBe(true)
  })

  it('adds the partial-year caveat only when trackedFrom is set', () => {
    const partial = { ...yearReview, trackedFrom: '2026-06-09' }
    expect(texts(layoutShareCard(partial)).some((s) => s.startsWith('Tracked from'))).toBe(true)
    expect(texts(layoutShareCard(yearReview)).some((s) => s.startsWith('Tracked from'))).toBe(
      false
    )
  })

  it('omits the previous-level row when unknown', () => {
    const noPrev: ShareCardData = {
      ...levelUp,
      stats: { ...levelUp.stats, daysOnPreviousLevel: null },
    }
    expect(texts(layoutShareCard(noPrev)).some((s) => s.includes('took'))).toBe(false)
  })

  it('truncates long milestone labels with an ellipsis', () => {
    const long = { ...milestone, label: 'Reached Guru on all available items everywhere' }
    const headline = texts(layoutShareCard(long)).find((s) => s.endsWith('…'))
    expect(headline).toBeDefined()
    expect(headline!.length).toBeLessThanOrEqual(20)
  })

  it('is deterministic', () => {
    expect(layoutShareCard(yearReview)).toEqual(layoutShareCard(yearReview))
  })
})

describe('truncateLabel', () => {
  it('returns short strings unchanged', () => {
    expect(truncateLabel('short', 10)).toBe('short')
  })

  it('cuts to the limit including the ellipsis, without trailing spaces', () => {
    expect(truncateLabel('hello world', 8)).toBe('hello w…')
    expect(truncateLabel('hello wo rld', 9)).toBe('hello wo…')
  })
})
