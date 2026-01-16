/**
 * Data Collectors
 *
 * Functions to gather data from IndexedDB and LocalStorage for export
 */

import { getAll } from '@/lib/db/database'
import { STORES } from '@/lib/db/schema'
import { getSyncMetadata } from '@/lib/db/sync-metadata'
import type {
  ExportOptions,
  ExportSettings,
  CachedSubject,
  CachedAssignment,
  CachedReviewStatistic,
  CachedLevelProgression,
  SyncMetadata,
} from './export-types'

/**
 * Collect all exportable data from IndexedDB based on options
 *
 * @param options - Export options specifying what to include
 * @returns Object with requested data arrays
 */
export async function collectIndexedDBData(options: ExportOptions): Promise<{
  subjects?: CachedSubject[]
  assignments?: CachedAssignment[]
  reviewStatistics?: CachedReviewStatistic[]
  levelProgressions?: CachedLevelProgression[]
  syncMetadata?: SyncMetadata
}> {
  const data: {
    subjects?: CachedSubject[]
    assignments?: CachedAssignment[]
    reviewStatistics?: CachedReviewStatistic[]
    levelProgressions?: CachedLevelProgression[]
    syncMetadata?: SyncMetadata
  } = {}

  try {
    // Collect subjects (kanji, vocab, radicals)
    if (options.includeSubjects) {
      try {
        const subjects = await getAll<CachedSubject>(STORES.SUBJECTS)
        // Already in cached format
        data.subjects = subjects
      } catch (error) {
        console.error('Failed to collect subjects:', error)
        throw new Error('Failed to read subjects data')
      }
    }

    // Collect assignments (user's progress)
    if (options.includeAssignments) {
      try {
        const assignments = await getAll<CachedAssignment>(STORES.ASSIGNMENTS)
        // Already in cached format
        data.assignments = assignments
      } catch (error) {
        console.error('Failed to collect assignments:', error)
        throw new Error('Failed to read assignments data')
      }
    }

    // Collect review statistics (accuracy data)
    if (options.includeReviewStats) {
      try {
        const reviewStats = await getAll<CachedReviewStatistic>(
          STORES.REVIEW_STATISTICS
        )
        // Already in cached format
        data.reviewStatistics = reviewStats
      } catch (error) {
        console.error('Failed to collect review statistics:', error)
        throw new Error('Failed to read review statistics data')
      }
    }

    // Collect level progressions (historical data)
    if (options.includeLevelProgressions) {
      try {
        const levelProgressions = await getAll<CachedLevelProgression>(
          STORES.LEVEL_PROGRESSIONS
        )
        // Already in cached format
        data.levelProgressions = levelProgressions
      } catch (error) {
        console.error('Failed to collect level progressions:', error)
        throw new Error('Failed to read level progressions data')
      }
    }

    // Collect sync metadata (timestamps)
    if (options.includeSyncMetadata) {
      try {
        data.syncMetadata = await getSyncMetadata()
      } catch (error) {
        console.error('Failed to collect sync metadata:', error)
        throw new Error('Failed to read sync metadata')
      }
    }

    return data
  } catch (error) {
    console.error('Error collecting IndexedDB data:', error)
    throw error
  }
}

/**
 * Collect settings from LocalStorage
 *
 * @param options - Export options
 * @param settingsStore - Zustand settings store
 * @param userStore - Zustand user store
 * @returns Settings object for export
 */
export function collectSettings(
  options: ExportOptions,
  settingsStore: any,
  userStore: any
): ExportSettings | undefined {
  if (!options.includeSettings) return undefined

  try {
    const settings: ExportSettings = {
      theme: settingsStore.theme,
      itemsPerPage: settingsStore.itemsPerPage,
      autoRefreshEnabled: settingsStore.autoRefreshEnabled,
      autoRefreshInterval: settingsStore.autoRefreshInterval,
    }

    // Only include API token if explicitly requested (SENSITIVE)
    if (options.includeApiToken && userStore.token) {
      settings.apiToken = userStore.token
    }

    return settings
  } catch (error) {
    console.error('Failed to collect settings:', error)
    throw new Error('Failed to read settings data')
  }
}

/**
 * Estimate export size before creating the full export
 *
 * Provides quick estimation without actually gathering all data
 *
 * @param options - Export options
 * @returns Formatted size estimate
 */
export async function estimateExportSize(
  options: ExportOptions
): Promise<string> {
  try {
    let estimatedBytes = 0

    // Base metadata size
    estimatedBytes += 1024 // ~1KB for metadata

    // Estimate based on typical data sizes
    if (options.includeSubjects) {
      estimatedBytes += 10 * 1024 * 1024 // ~10MB (subjects are large)
    }
    if (options.includeAssignments) {
      estimatedBytes += 400 * 1024 // ~400KB
    }
    if (options.includeReviewStats) {
      estimatedBytes += 200 * 1024 // ~200KB
    }
    if (options.includeLevelProgressions) {
      estimatedBytes += 10 * 1024 // ~10KB
    }
    if (options.includeSyncMetadata) {
      estimatedBytes += 1024 // ~1KB
    }
    if (options.includeSettings) {
      estimatedBytes += 1024 // ~1KB
    }

    // Format the size
    if (estimatedBytes < 1024) {
      return `~${estimatedBytes} B`
    } else if (estimatedBytes < 1024 * 1024) {
      return `~${Math.ceil(estimatedBytes / 1024)} KB`
    } else {
      return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
    }
  } catch (error) {
    console.error('Failed to estimate export size:', error)
    return 'Unknown'
  }
}
