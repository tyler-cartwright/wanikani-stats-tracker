// src/lib/api/queries.ts
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/user-store'
import { useSyncStore } from '@/stores/sync-store'
import { fetchUser, fetchSummary, fetchResets } from './endpoints'
import { getCachedSubjects } from '@/lib/db/repositories/subjects'
import { getCachedAssignments } from '@/lib/db/repositories/assignments'
import { getCachedReviewStatistics } from '@/lib/db/repositories/review-statistics'
import { getCachedLevelProgressions } from '@/lib/db/repositories/level-progressions'
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
}

/**
 * User - always fetched fresh (small payload, important to be current)
 */
export function useUser() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchUser(token)
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Resets - fetched fresh from API (tiny payload, rarely changes)
 */
export function useResets() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.resets,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchResets(token)
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Summary - always fetched fresh (changes hourly, small payload)
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
