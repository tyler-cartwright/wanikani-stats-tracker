// src/lib/api/queries.ts
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/user-store'
import { useSyncStore } from '@/stores/sync-store'
import { fetchUser, fetchSummary, fetchResets } from './endpoints'
import {
  getResetsSnapshot,
  getUserSnapshot,
  saveResetsSnapshot,
  saveUserSnapshot,
} from '@/lib/db/repositories/api-snapshots'
import { getCachedSubjects } from '@/lib/db/repositories/subjects'
import { getCachedAssignments } from '@/lib/db/repositories/assignments'
import {
  getCachedReviewStatisticRows,
  getCachedReviewStatistics,
} from '@/lib/db/repositories/review-statistics'
import { getCachedLevelProgressions } from '@/lib/db/repositories/level-progressions'
import { getActivityHistory } from '@/lib/db/repositories/activity-history'
import { getTrainerSessions } from '@/lib/db/repositories/trainer-sessions'
import { getLastSyncInfo } from '@/lib/sync/sync-manager'

export const queryKeys = {
  user: ['user'] as const,
  assignments: ['assignments'] as const,
  subjects: ['subjects'] as const,
  levelProgressions: ['levelProgressions'] as const,
  reviewStatistics: ['reviewStatistics'] as const,
  summary: ['summary'] as const,
  syncStatus: ['syncStatus'] as const,
  resets: ['resets'] as const,
  activityHistory: ['activityHistory'] as const,
  trainerSessions: ['trainerSessions'] as const,
  reviewStatisticRows: ['reviewStatisticRows'] as const,
}

// Network-reliant queries use networkMode: 'always' so their queryFns still
// run while the browser reports offline (React Query v5 pauses them under the
// default 'online' mode) — letting the snapshot fallbacks below decide what
// to serve. The IndexedDB-backed queries use it too: they're pure local reads
// and should never be paused by network state.
//
// Trade-off: snapshot-served data counts as a successful fetch, so a
// reconnect refetch can lag by up to the query's staleTime. The background
// delta sync on launch/reconnect dominates actual freshness.

/**
 * User - fetched fresh (small payload, important to be current), falling
 * back to the last-known snapshot when the network is unavailable.
 */
export function useUser() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      if (!token) throw new Error('No API token available')
      try {
        const user = await fetchUser(token)
        saveUserSnapshot(user).catch((err) =>
          console.warn('[QUERY] Failed to save user snapshot:', err)
        )
        return user
      } catch (error) {
        const snapshot = await getUserSnapshot()
        if (snapshot !== undefined) return snapshot
        throw error
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    networkMode: 'always',
  })
}

/**
 * Resets - fetched fresh (tiny payload, rarely changes), falling back to the
 * last-known snapshot when the network is unavailable. Critical for reset
 * users: defaulting to [] offline would resurface pre-reset data (see 2.19.1).
 */
export function useResets() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.resets,
    queryFn: async () => {
      if (!token) throw new Error('No API token available')
      try {
        const resets = await fetchResets(token)
        saveResetsSnapshot(resets).catch((err) =>
          console.warn('[QUERY] Failed to save resets snapshot:', err)
        )
        return resets
      } catch (error) {
        const snapshot = await getResetsSnapshot()
        if (snapshot !== undefined) return snapshot
        throw error
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    networkMode: 'always',
  })
}

/**
 * Summary - always fetched fresh (changes hourly, small payload). No
 * snapshot: it goes stale within the hour, so consumers derive offline
 * fallbacks from local assignments instead (summary-fallback.ts).
 */
export function useSummary() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.summary,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchSummary(token)
    },
    enabled: !!token,
    staleTime: 10 * 1000,
    gcTime: 60 * 1000,
    refetchInterval: 30 * 1000,
    retry: 1,
    networkMode: 'always',
  })
}

/**
 * Subjects - loaded from IndexedDB cache
 * Kept fresh for 5 min; post-sync invalidation (removeQueries + refetchQueries in use-sync.ts)
 * handles freshness after a sync, so redundant per-navigation reads are unnecessary.
 */
export function useSubjects() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: getCachedSubjects,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on sync
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: false, // post-sync invalidation handles freshness
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Assignments - loaded from IndexedDB cache
 * Kept fresh for 5 min; post-sync invalidation (removeQueries + refetchQueries in use-sync.ts)
 * handles freshness after a sync, so redundant per-navigation reads are unnecessary.
 */
export function useAssignments() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: getCachedAssignments,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on sync
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: false, // post-sync invalidation handles freshness
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Review Statistics - loaded from IndexedDB cache
 * Kept fresh for 5 min; post-sync invalidation (removeQueries + refetchQueries in use-sync.ts)
 * handles freshness after a sync, so redundant per-navigation reads are unnecessary.
 */
export function useReviewStatistics() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.reviewStatistics,
    queryFn: getCachedReviewStatistics,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on sync
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: false, // post-sync invalidation handles freshness
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Review Statistics with cache-write times - loaded from IndexedDB cache.
 * The trainer's recently-failed pool needs the row write time as a recency
 * proxy; everything else should keep using useReviewStatistics.
 */
export function useReviewStatisticRows() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.reviewStatisticRows,
    queryFn: getCachedReviewStatisticRows,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on sync
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: false, // post-sync invalidation handles freshness
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Level Progressions - loaded from IndexedDB cache
 * Kept fresh for 5 min; post-sync invalidation (removeQueries + refetchQueries in use-sync.ts)
 * handles freshness after a sync, so redundant per-navigation reads are unnecessary.
 */
export function useLevelProgressions() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.levelProgressions,
    queryFn: getCachedLevelProgressions,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on sync
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: false, // post-sync invalidation handles freshness
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Activity History - loaded from IndexedDB (read-only; rows are written
 * exclusively by the sync-time capture engine).
 * Kept fresh for 5 min; post-sync invalidation (removeQueries + refetchQueries in use-sync.ts)
 * handles freshness after a sync, so redundant per-navigation reads are unnecessary.
 */
export function useActivityHistory() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.activityHistory,
    queryFn: getActivityHistory,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 min — data only changes on sync
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: false, // post-sync invalidation handles freshness
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Trainer Sessions - loaded from IndexedDB (local-only; written by the
 * trainer page, never by sync — so no isSyncing gate). The trainer page
 * invalidates this key after persisting a session.
 */
export function useTrainerSessions() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.trainerSessions,
    queryFn: getTrainerSessions,
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // invalidation after each session handles freshness
    gcTime: 30 * 60 * 1000,
    retry: 1,
    networkMode: 'always', // local IndexedDB read — never pause on network state
  })
}

/**
 * Sync Status - check if we have cached data
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: queryKeys.syncStatus,
    queryFn: getLastSyncInfo,
    staleTime: 0,
    gcTime: 0,
  })
}
