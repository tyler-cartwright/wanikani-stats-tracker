// src/hooks/use-sync.ts
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncStore } from '@/stores/sync-store'
import { useUserStore } from '@/stores/user-store'
import { performSync, forceFullSync, getLastSyncInfo } from '@/lib/sync/sync-manager'
import { queryKeys } from '@/lib/api/queries'

export function useSync() {
  const queryClient = useQueryClient()
  const token = useUserStore((state) => state.token)
  const { isSyncing, lastSyncAt, lastSyncResult, progress, error, setSyncing, setProgress, setLastSync, setError } =
    useSyncStore()

  const sync = useCallback(
    async (force = false) => {
      console.log('[USE-SYNC] sync() called - force:', force, 'token:', token ? 'present' : 'missing', 'isSyncing:', isSyncing)

      if (!token) {
        const errorMessage = 'No API token available'
        console.error('[USE-SYNC] No token available')
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      if (isSyncing) {
        console.log('[USE-SYNC] Already syncing, returning early')
        return
      }

      console.log('[USE-SYNC] Starting sync...')
      setSyncing(true)
      setError(null)

      try {
        const syncFn = force ? forceFullSync : performSync
        console.log('[USE-SYNC] Calling', force ? 'forceFullSync' : 'performSync')
        const result = await syncFn(token, setProgress)
        console.log('[USE-SYNC] Sync result:', result)

        setLastSync(result)

        // If sync failed, set the error
        if (!result.success && result.error) {
          setError(result.error)
        }

        // Invalidate all queries to pick up new data
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
          await queryClient.invalidateQueries({ queryKey: queryKeys.assignments })
          await queryClient.invalidateQueries({ queryKey: queryKeys.reviewStatistics })
          await queryClient.invalidateQueries({ queryKey: queryKeys.levelProgressions })
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed'
        setError(errorMessage)
        throw err
      } finally {
        setSyncing(false)
        setProgress(null)
      }
    },
    [token, isSyncing, queryClient, setSyncing, setProgress, setLastSync, setError]
  )

  const checkSyncStatus = useCallback(async () => {
    return getLastSyncInfo()
  }, [])

  return {
    sync,
    forceSync: () => sync(true),
    checkSyncStatus,
    isSyncing,
    lastSyncAt,
    lastSyncResult,
    progress,
    error,
  }
}
