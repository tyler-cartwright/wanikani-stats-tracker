// src/lib/db/schema.ts
export const DB_NAME = 'wanitrack'
// Bumping DB_VERSION requires a corresponding entry in migrations.ts.
// Migrations must preserve existing data — delta sync handles freshness.
export const DB_VERSION = 3

export interface SyncMetadata {
  id: string // 'sync_metadata' - singleton
  subjectsUpdatedAt: string | null
  assignmentsUpdatedAt: string | null
  reviewStatisticsUpdatedAt: string | null
  levelProgressionsUpdatedAt: string | null
  lastFullSync: string | null
}

export interface CachedSubject {
  id: number
  data: any // The full subject data
  updatedAt: string
}

export interface CachedAssignment {
  id: number
  subjectId: number
  data: any
  updatedAt: string
}

export interface CachedReviewStatistic {
  id: number
  subjectId: number
  data: any
  updatedAt: string
}

export interface CachedLevelProgression {
  id: number
  level: number
  data: any
  updatedAt: string
}

// Last-known responses for endpoints that aren't delta-synced collections
// (/user, /resets). One record per endpoint; used as offline fallbacks.
export interface ApiSnapshot<T = unknown> {
  endpoint: 'user' | 'resets'
  data: T
  updatedAt: string
}

// One row per local calendar day of captured study activity. WaniKani's
// /reviews endpoint is gone, so these rows are accumulated forward-only and
// can never be re-downloaded — no code path may clear this store except an
// explicit full logout.
export interface ActivityDayRow {
  date: string // 'YYYY-MM-DD' (local timezone at capture time)
  // Review answer deltas; accumulate across syncs within the day
  reviews: {
    meaningCorrect: number
    meaningIncorrect: number
    readingCorrect: number
    readingIncorrect: number
  }
  // Assignments whose started_at transitioned from unset to set
  lessons: number
  // Counts per SRS stage 0..9 of non-hidden, started assignments; null until
  // the first snapshot lands on this date. Latest snapshot of the day wins.
  srsSnapshot: number[] | null
  // True when a full (no-baseline) sync happened this day: deltas before this
  // date are missing, and this day's counts only cover post-baseline syncs.
  baseline?: boolean
  updatedAt: string
}

export const STORES = {
  SYNC_METADATA: 'sync_metadata',
  SUBJECTS: 'subjects',
  ASSIGNMENTS: 'assignments',
  REVIEW_STATISTICS: 'review_statistics',
  LEVEL_PROGRESSIONS: 'level_progressions',
  API_SNAPSHOTS: 'api_snapshots',
  ACTIVITY_HISTORY: 'activity_history',
} as const
