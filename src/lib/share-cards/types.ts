// Share card data — everything a card template needs, fully resolved.
// Discriminated on `kind`; built by data-prep.ts, laid out by layout.ts.

export type ShareCardIcon = 'flame' | 'star' | 'trophy'

export interface LevelUpCardData {
  kind: 'level-up'
  username: string
  level: number
  reachedAt: string | null // ISO timestamp
  stats: {
    itemsPassed: number
    itemsBurned: number
    daysOnPreviousLevel: number | null
  }
}

export interface MilestoneCardData {
  kind: 'milestone'
  username: string
  label: string
  description: string
  icon: ShareCardIcon
  achievedAt: string | null // ISO timestamp
}

export interface YearInReviewCardData {
  kind: 'year-review'
  username: string
  year: number
  totalReviews: number
  totalLessons: number
  activeDays: number
  longestStreak: number
  busiestDay: { date: string; total: number } | null
  milestones: string[] // up to 3 labels achieved that year, most recent first
  trackedFrom: string | null // 'YYYY-MM-DD'; non-null = partial-year caveat
}

export type ShareCardData = LevelUpCardData | MilestoneCardData | YearInReviewCardData
