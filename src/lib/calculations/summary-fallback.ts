// Summary Fallback Calculations
//
// The /summary endpoint is the authoritative source for lessons available
// and the next review time, but it cannot be served offline. These derive
// the same figures from locally synced assignments so the dashboard stays
// meaningful when /summary is unreachable.
import type { Assignment } from '@/lib/api/types'

/**
 * Lessons available: assignments that are unlocked but not yet started.
 */
export function countLessonsAvailable(assignments: Assignment[]): number {
  return assignments.filter(
    (a) =>
      !a.hidden && a.srs_stage === 0 && a.unlocked_at !== null && a.started_at === null
  ).length
}

/**
 * Reviews available now: started, unburned assignments whose review time
 * has arrived.
 */
export function countReviewsAvailable(assignments: Assignment[], now: Date): number {
  return assignments.filter((a) => {
    if (a.hidden) return false // Hidden items don't appear in reviews
    if (!a.available_at) return false
    if (a.srs_stage === 0) return false // Not started
    if (a.srs_stage === 9) return false // Burned
    return new Date(a.available_at) <= now
  }).length
}

/**
 * Next upcoming review time: the earliest available_at strictly in the
 * future among review-eligible assignments. Null when none is scheduled.
 */
export function getNextReviewAt(assignments: Assignment[], now: Date): string | null {
  let next: string | null = null
  for (const a of assignments) {
    if (a.hidden || !a.available_at || a.srs_stage === 0 || a.srs_stage === 9) continue
    if (new Date(a.available_at) <= now) continue
    if (next === null || new Date(a.available_at) < new Date(next)) {
      next = a.available_at
    }
  }
  return next
}
