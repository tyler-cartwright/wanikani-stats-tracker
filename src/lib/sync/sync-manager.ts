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

    // Sync assignments, review stats, and level progressions in parallel —
    // they're all independent of each other; only subjects needed to go first.
    onProgress?.({ phase: 'assignments', message: 'Syncing remaining data...', isFullSync: result.isFullSync })

    let completedCount = 0
    const phases = ['reviewStats', 'levelProgressions'] as const
    const advanceProgress = () => {
      const phase = phases[completedCount++]
      if (phase) onProgress?.({ phase, message: 'Syncing remaining data...', isFullSync: result.isFullSync })
    }

    const [assignmentsOutcome, statsOutcome, progressionsOutcome] = await Promise.allSettled([
      syncAssignments(token).then(r => { advanceProgress(); return r }),
      syncReviewStatistics(token).then(r => { advanceProgress(); return r }),
      syncLevelProgressions(token).then(r => { advanceProgress(); return r }),
    ])

    const errors: string[] = []
    if (assignmentsOutcome.status === 'fulfilled') {
      result.assignments = assignmentsOutcome.value.updated
    } else {
      errors.push(`assignments: ${assignmentsOutcome.reason instanceof Error ? assignmentsOutcome.reason.message : String(assignmentsOutcome.reason)}`)
    }
    if (statsOutcome.status === 'fulfilled') {
      result.reviewStatistics = statsOutcome.value.updated
    } else {
      errors.push(`reviewStats: ${statsOutcome.reason instanceof Error ? statsOutcome.reason.message : String(statsOutcome.reason)}`)
    }
    if (progressionsOutcome.status === 'fulfilled') {
      result.levelProgressions = progressionsOutcome.value.updated
    } else {
      errors.push(`levelProgressions: ${progressionsOutcome.reason instanceof Error ? progressionsOutcome.reason.message : String(progressionsOutcome.reason)}`)
    }

    if (errors.length === 3) {
      throw new Error(`All parallel syncs failed: ${errors.join('; ')}`)
    } else if (errors.length > 0) {
      console.warn('[SYNC] Some parallel syncs failed (partial sync):', errors)
    }

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
