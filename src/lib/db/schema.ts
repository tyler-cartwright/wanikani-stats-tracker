// src/lib/db/schema.ts
export const DB_NAME = 'wanitrack'
export const DB_VERSION = 1

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

export const STORES = {
  SYNC_METADATA: 'sync_metadata',
  SUBJECTS: 'subjects',
  ASSIGNMENTS: 'assignments',
  REVIEW_STATISTICS: 'review_statistics',
  LEVEL_PROGRESSIONS: 'level_progressions',
} as const
