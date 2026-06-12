// src/lib/sync/sync-manager.ts
import { syncSubjects } from '@/lib/db/repositories/subjects'
import { syncAssignments } from '@/lib/db/repositories/assignments'
import { syncReviewStatistics } from '@/lib/db/repositories/review-statistics'
import { syncLevelProgressions } from '@/lib/db/repositories/level-progressions'
import { recordSyncActivity } from '@/lib/db/repositories/activity-history'
import { updateSyncMetadata, getSyncMetadata } from '@/lib/db/sync-metadata'
import { clearStores } from '@/lib/db/database'
import { STORES } from '@/lib/db/schema'
import { debugLog } from '@/lib/utils/debug-log'

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
  debugLog('[SYNC] performSync started with token:', token ? 'present' : 'missing')

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
    debugLog('[SYNC] Starting subjects sync...')
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

    // Record activity history (review/lesson deltas + SRS snapshot). A failed
    // collection contributes undefined changes — its facet is left untouched
    // and its un-overwritten cache stays a valid baseline for the next sync.
    // Capture failures must never fail the sync itself.
    try {
      await recordSyncActivity({
        statChanges: statsOutcome.status === 'fulfilled' ? statsOutcome.value.changes : undefined,
        statsFullSync: statsOutcome.status === 'fulfilled' && statsOutcome.value.isFullSync,
        assignmentChanges:
          assignmentsOutcome.status === 'fulfilled' ? assignmentsOutcome.value.changes : undefined,
        assignmentsFullSync:
          assignmentsOutcome.status === 'fulfilled' && assignmentsOutcome.value.isFullSync,
      })
    } catch (captureError) {
      console.warn('[SYNC] Activity capture failed (history not recorded for this sync):', captureError)
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

// Force sync means "re-download the API collections", so it must spare:
// - activity_history: forward-only captured data that can never be
//   re-downloaded (GET /reviews is gone) — only logout may clear it
// - api_snapshots: offline /user and /resets fallbacks; wiping them would
//   reopen the 2.19.1 offline reset-data bug for no benefit (they're
//   rewritten on the next successful fetch anyway)
// - trainer_sessions: local-only training history that no API holds — only
//   logout may clear it
const PRESERVED_ON_FORCE_SYNC: string[] = [
  STORES.ACTIVITY_HISTORY,
  STORES.API_SNAPSHOTS,
  STORES.TRAINER_SESSIONS,
]

/**
 * Forces a complete resync by clearing the synced collections first
 */
export async function forceFullSync(
  token: string,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  onProgress?.({ phase: 'idle', message: 'Clearing local data...', isFullSync: true })
  await clearStores(
    Object.values(STORES).filter((store) => !PRESERVED_ON_FORCE_SYNC.includes(store))
  )
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
