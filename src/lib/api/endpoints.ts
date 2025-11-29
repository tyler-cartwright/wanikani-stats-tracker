// WaniKani API v2 Endpoints
// Typed functions for each API resource

import { fetchResource, fetchAllPages } from './client'
import type {
  User,
  Assignment,
  Subject,
  LevelProgression,
  ReviewStatistic,
  Summary,
} from './types'

// ============================================================================
// User
// ============================================================================

/**
 * Fetch the authenticated user's information
 * https://docs.api.wanikani.com/20170710/#get-user-information
 */
export async function fetchUser(token: string): Promise<User> {
  return fetchResource<User>('/user', token)
}

// ============================================================================
// Assignments
// ============================================================================

/**
 * Fetch all assignments for the user
 * Handles pagination automatically
 * https://docs.api.wanikani.com/20170710/#get-all-assignments
 */
export async function fetchAssignments(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(Assignment & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/assignments?${params}` : '/assignments'
  return fetchAllPages<Assignment>(endpoint, token, onProgress)
}

/**
 * Fetch assignments with filters
 * @param filters - Optional filters (levels, subject_types, srs_stages, etc.)
 */
export async function fetchAssignmentsFiltered(
  token: string,
  filters?: {
    levels?: number[]
    subject_types?: ('radical' | 'kanji' | 'vocabulary')[]
    srs_stages?: number[]
    unlocked?: boolean
    hidden?: boolean
  },
  onProgress?: (current: number, total: number) => void
): Promise<Assignment[]> {
  const params = new URLSearchParams()

  if (filters?.levels) {
    params.append('levels', filters.levels.join(','))
  }
  if (filters?.subject_types) {
    params.append('subject_types', filters.subject_types.join(','))
  }
  if (filters?.srs_stages) {
    params.append('srs_stages', filters.srs_stages.join(','))
  }
  if (filters?.unlocked !== undefined) {
    params.append('unlocked', String(filters.unlocked))
  }
  if (filters?.hidden !== undefined) {
    params.append('hidden', String(filters.hidden))
  }

  const queryString = params.toString()
  const endpoint = queryString ? `/assignments?${queryString}` : '/assignments'

  return fetchAllPages<Assignment>(endpoint, token, onProgress)
}

// ============================================================================
// Subjects
// ============================================================================

/**
 * Fetch all subjects (radicals, kanji, vocabulary)
 * Handles pagination automatically
 * https://docs.api.wanikani.com/20170710/#get-all-subjects
 */
export async function fetchSubjects(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(Subject & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/subjects?${params}` : '/subjects'
  return fetchAllPages<Subject>(endpoint, token, onProgress)
}

/**
 * Fetch subjects with filters
 */
export async function fetchSubjectsFiltered(
  token: string,
  filters?: {
    ids?: number[]
    types?: ('radical' | 'kanji' | 'vocabulary')[]
    levels?: number[]
    hidden?: boolean
  },
  onProgress?: (current: number, total: number) => void
): Promise<(Subject & { id: number })[]> {
  const params = new URLSearchParams()

  if (filters?.ids) {
    params.append('ids', filters.ids.join(','))
  }
  if (filters?.types) {
    params.append('types', filters.types.join(','))
  }
  if (filters?.levels) {
    params.append('levels', filters.levels.join(','))
  }
  if (filters?.hidden !== undefined) {
    params.append('hidden', String(filters.hidden))
  }

  const queryString = params.toString()
  const endpoint = queryString ? `/subjects?${queryString}` : '/subjects'

  return fetchAllPages<Subject>(endpoint, token, onProgress)
}

// ============================================================================
// Level Progressions
// ============================================================================

/**
 * Fetch all level progressions
 * https://docs.api.wanikani.com/20170710/#get-all-level-progressions
 */
export async function fetchLevelProgressions(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(LevelProgression & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/level_progressions?${params}` : '/level_progressions'
  return fetchAllPages<LevelProgression>(endpoint, token, onProgress)
}

// ============================================================================
// Review Statistics
// ============================================================================

/**
 * Fetch all review statistics
 * https://docs.api.wanikani.com/20170710/#get-all-review-statistics
 */
export async function fetchReviewStatistics(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(ReviewStatistic & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/review_statistics?${params}` : '/review_statistics'
  return fetchAllPages<ReviewStatistic>(endpoint, token, onProgress)
}

/**
 * Fetch review statistics with filters
 */
export async function fetchReviewStatisticsFiltered(
  token: string,
  filters?: {
    subject_ids?: number[]
    subject_types?: ('radical' | 'kanji' | 'vocabulary')[]
    hidden?: boolean
    percentages_greater_than?: number
    percentages_less_than?: number
  },
  onProgress?: (current: number, total: number) => void
): Promise<ReviewStatistic[]> {
  const params = new URLSearchParams()

  if (filters?.subject_ids) {
    params.append('subject_ids', filters.subject_ids.join(','))
  }
  if (filters?.subject_types) {
    params.append('subject_types', filters.subject_types.join(','))
  }
  if (filters?.hidden !== undefined) {
    params.append('hidden', String(filters.hidden))
  }
  if (filters?.percentages_greater_than !== undefined) {
    params.append('percentages_greater_than', String(filters.percentages_greater_than))
  }
  if (filters?.percentages_less_than !== undefined) {
    params.append('percentages_less_than', String(filters.percentages_less_than))
  }

  const queryString = params.toString()
  const endpoint = queryString ? `/review_statistics?${queryString}` : '/review_statistics'

  return fetchAllPages<ReviewStatistic>(endpoint, token, onProgress)
}

// ============================================================================
// Summary
// ============================================================================

/**
 * Fetch summary (lessons and reviews available)
 * https://docs.api.wanikani.com/20170710/#get-summary
 */
export async function fetchSummary(token: string): Promise<Summary> {
  return fetchResource<Summary>('/summary', token)
}
