// src/lib/sync/sync-manager.ts
import { syncSubjects } from '@/lib/db/repositories/subjects'
import { syncAssignments } from '@/lib/db/repositories/assignments'
import { syncReviewStatistics } from '@/lib/db/repositories/review-statistics'
import { syncLevelProgressions } from '@/lib/db/repositories/level-progressions'
import { updateSyncMetadata, getSyncMetadata } from '@/lib/db/sync-metadata'
import { clearDatabase } from '@/lib/db/database'

export interface SyncProgress {
  phase: 'idle' | 'subjects' | 'assignments' | 'reviewStats' | 'levelProgressions' | 'complete' | 'error'
  message: string
  isFullSync: boolean
}

export interface SyncResult {
  success: boolean
  subjects: number
  assignments: number
  reviewStatistics: number
  levelProgressions: number
  isFullSync: boolean
  error?: string
}

export type SyncProgressCallback = (progress: SyncProgress) => void

/**
 * Performs a full or delta sync of all data
 */
export async function performSync(
  token: string,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  console.log('[SYNC] performSync started with token:', token ? 'present' : 'missing')

  const result: SyncResult = {
    success: false,
    subjects: 0,
    assignments: 0,
    reviewStatistics: 0,
    levelProgressions: 0,
    isFullSync: false,
  }

  try {
    // Sync subjects first (they're the foundation)
    console.log('[SYNC] Starting subjects sync...')
    onProgress?.({ phase: 'subjects', message: 'Syncing subjects...', isFullSync: false })
    const subjectsResult = await syncSubjects(token, (msg) =>
      onProgress?.({ phase: 'subjects', message: msg, isFullSync: false })
    )
    result.subjects = subjectsResult.updated
    result.isFullSync = subjectsResult.isFullSync

    // Sync assignments
    onProgress?.({ phase: 'assignments', message: 'Syncing assignments...', isFullSync: result.isFullSync })
    const assignmentsResult = await syncAssignments(token, (msg) =>
      onProgress?.({ phase: 'assignments', message: msg, isFullSync: result.isFullSync })
    )
    result.assignments = assignmentsResult.updated

    // Sync review statistics
    onProgress?.({ phase: 'reviewStats', message: 'Syncing review statistics...', isFullSync: result.isFullSync })
    const statsResult = await syncReviewStatistics(token, (msg) =>
      onProgress?.({ phase: 'reviewStats', message: msg, isFullSync: result.isFullSync })
    )
    result.reviewStatistics = statsResult.updated

    // Sync level progressions
    onProgress?.({ phase: 'levelProgressions', message: 'Syncing level progressions...', isFullSync: result.isFullSync })
    const progressionsResult = await syncLevelProgressions(token, (msg) =>
      onProgress?.({ phase: 'levelProgressions', message: msg, isFullSync: result.isFullSync })
    )
    result.levelProgressions = progressionsResult.updated

    // Update last full sync time
    await updateSyncMetadata({
      lastFullSync: new Date().toISOString(),
    })

    result.success = true
    onProgress?.({ phase: 'complete', message: 'Sync complete', isFullSync: result.isFullSync })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SYNC] Error during sync:', error)
    result.error = errorMessage
    onProgress?.({ phase: 'error', message: errorMessage, isFullSync: result.isFullSync })
    return result
  }
}

/**
 * Forces a complete resync by clearing the database first
 */
export async function forceFullSync(
  token: string,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  onProgress?.({ phase: 'idle', message: 'Clearing local data...', isFullSync: true })
  await clearDatabase()
  return performSync(token, onProgress)
}

/**
 * Gets info about the last sync
 */
export async function getLastSyncInfo(): Promise<{
  lastSync: Date | null
  hasData: boolean
}> {
  const metadata = await getSyncMetadata()
  return {
    lastSync: metadata.lastFullSync ? new Date(metadata.lastFullSync) : null,
    hasData: !!metadata.subjectsUpdatedAt,
  }
}
