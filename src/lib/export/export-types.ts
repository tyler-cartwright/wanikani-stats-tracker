/**
 * Export Types
 *
 * TypeScript interfaces for the data export system
 */

import type { CachedSubject } from '@/lib/db/repositories/subjects'
import type { CachedAssignment } from '@/lib/db/repositories/assignments'
import type { CachedReviewStatistic } from '@/lib/db/repositories/review-statistics'
import type { CachedLevelProgression } from '@/lib/db/repositories/level-progressions'

/**
 * User-configurable export options
 */
export interface ExportOptions {
  includeSubjects: boolean // Kanji, vocab, radicals with full details (~10MB)
  includeAssignments: boolean // User's progress on each item (~400KB)
  includeReviewStats: boolean // Accuracy and performance data (~200KB)
  includeLevelProgressions: boolean // Historical level completion data (~10KB)
  includeSyncMetadata: boolean // Sync timestamps (~1KB)
  includeSettings: boolean // User preferences (~1KB)
  includeApiToken: boolean // WaniKani API token (SENSITIVE - default false)
}

/**
 * Metadata included with every export
 */
export interface ExportMetadata {
  version: string // Export format version (e.g., "1.0")
  exportedAt: string // ISO timestamp of export
  appVersion: string // WaniTrack version (from package.json)
  username: string // WaniKani username
  level: number // Current WaniKani level
  exportType: 'full' | 'progress' | 'settings' // Type of export based on options
  options: ExportOptions // Options used for this export
}

/**
 * Settings data structure for export
 */
export interface ExportSettings {
  theme: 'light' | 'dark'
  itemsPerPage: number
  autoRefreshEnabled: boolean
  autoRefreshInterval: number
  apiToken?: string // Only included if user explicitly opts in
}

/**
 * Sync metadata structure
 */
export interface SyncMetadata {
  id: string
  subjectsUpdatedAt: string | null
  assignmentsUpdatedAt: string | null
  reviewStatisticsUpdatedAt: string | null
  levelProgressionsUpdatedAt: string | null
  lastFullSync: string | null
}

/**
 * Re-export cached data structures for convenience
 */
export type {
  CachedSubject,
  CachedAssignment,
  CachedReviewStatistic,
  CachedLevelProgression,
}

/**
 * Complete export data structure
 */
export interface ExportData {
  metadata: ExportMetadata
  settings?: ExportSettings
  data?: {
    subjects?: CachedSubject[]
    assignments?: CachedAssignment[]
    reviewStatistics?: CachedReviewStatistic[]
    levelProgressions?: CachedLevelProgression[]
    syncMetadata?: SyncMetadata
  }
}

/**
 * Export result returned to UI
 */
export interface ExportResult {
  success: boolean
  filename: string
  size: string
  error?: string
}
