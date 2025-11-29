// TanStack Query Hooks for WaniKani API
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/user-store'
import {
  fetchUser,
  fetchAssignments,
  fetchSubjects,
  fetchLevelProgressions,
  fetchReviewStatistics,
  fetchSummary,
} from './endpoints'

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  user: ['user'] as const,
  assignments: ['assignments'] as const,
  subjects: ['subjects'] as const,
  levelProgressions: ['levelProgressions'] as const,
  reviewStatistics: ['reviewStatistics'] as const,
  summary: ['summary'] as const,
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch user information
 * Refetches rarely (user data doesn't change often)
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

/**
 * Fetch all assignments
 * Moderate refresh rate (changes when doing lessons/reviews)
 */
export function useAssignments() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchAssignments(token)
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Fetch all subjects (radicals, kanji, vocabulary)
 * Refetches rarely (subject data is essentially static)
 */
export function useSubjects() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchSubjects(token)
    },
    enabled: !!token,
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  })
}

/**
 * Fetch level progressions
 * Refetches occasionally (new data when leveling up)
 */
export function useLevelProgressions() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.levelProgressions,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchLevelProgressions(token)
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

/**
 * Fetch review statistics
 * Moderate refresh rate (changes after reviews)
 */
export function useReviewStatistics() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.reviewStatistics,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchReviewStatistics(token)
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Fetch summary (current reviews/lessons count)
 * Frequent refresh for live data
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
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
    retry: 1,
  })
}

/**
 * Prefetch all data
 * Useful for preloading data when user logs in
 */
export function usePrefetchAll() {
  const user = useUser()
  const assignments = useAssignments()
  const subjects = useSubjects()
  const levelProgressions = useLevelProgressions()
  const reviewStatistics = useReviewStatistics()
  const summary = useSummary()

  return {
    user,
    assignments,
    subjects,
    levelProgressions,
    reviewStatistics,
    summary,
    isLoading:
      user.isLoading ||
      assignments.isLoading ||
      subjects.isLoading ||
      levelProgressions.isLoading ||
      reviewStatistics.isLoading ||
      summary.isLoading,
    isError:
      user.isError ||
      assignments.isError ||
      subjects.isError ||
      levelProgressions.isError ||
      reviewStatistics.isError ||
      summary.isError,
  }
}
