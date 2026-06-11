// Activity capture — pure diff/merge logic for the per-day activity history.
//
// WaniKani removed GET /reviews in April 2023, so daily activity can only be
// reconstructed by diffing review-statistic totals between syncs. A bad diff
// corrupts history users cannot regenerate, which is why everything here is a
// pure function with tests written first; all IndexedDB access lives in
// src/lib/db/repositories/activity-history.ts.
//
// Known accepted limitation: two tabs syncing at the same moment can diff the
// same baseline and double-count a small delta window. The app already
// tolerates loose multi-tab behavior (see database.ts onversionchange);
// a navigator.locks guard around performSync is the future hardening if this
// ever shows up in practice.
import type { Assignment, ReviewStatistic } from '@/lib/api/types'
import type { ActivityDayRow } from '@/lib/db/schema'

export interface ReviewStatChange {
  // undefined previous = the stat is new since the last delta cursor, so its
  // totals are entirely new activity. Full syncs (no baseline) must never
  // reach this module — the caller skips capture for them.
  previous?: ReviewStatistic
  current: ReviewStatistic
}

export interface AssignmentChange {
  previous?: Assignment
  current: Assignment
}

export interface ReviewActivityDelta {
  meaningCorrect: number
  meaningIncorrect: number
  readingCorrect: number
  readingIncorrect: number
}

const ZERO_DELTA: ReviewActivityDelta = {
  meaningCorrect: 0,
  meaningIncorrect: 0,
  readingCorrect: 0,
  readingIncorrect: 0,
}

export const SRS_STAGE_COUNT = 10 // stages 0 (initiate) through 9 (burned)

// Local calendar date — a traveler crossing timezones may split one study day
// across two rows, which is acceptable for personal day-level stats.
export function formatLocalDate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// Inverse of formatLocalDate: 'YYYY-MM-DD' to local midnight. Never parse
// these strings with new Date(str) — that reads them as UTC and shifts the
// calendar day for anyone west of Greenwich.
export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// WaniKani answer totals are monotonic; a negative delta means we diffed
// against a corrupt or mismatched baseline. Clamp to zero per facet (never
// write negative history) and warn so it is visible in the field.
function clampedDelta(
  previous: number,
  current: number,
  subjectId: number,
  facet: string
): number {
  const delta = current - previous
  if (delta < 0) {
    console.warn(
      `[ACTIVITY] Negative ${facet} delta (${delta}) for subject ${subjectId}; clamping to 0`
    )
    return 0
  }
  return delta
}

export function computeReviewDeltas(changes: ReviewStatChange[]): ReviewActivityDelta {
  const total = { ...ZERO_DELTA }

  for (const { previous, current } of changes) {
    const id = current.subject_id
    total.meaningCorrect += clampedDelta(previous?.meaning_correct ?? 0, current.meaning_correct, id, 'meaning_correct')
    total.meaningIncorrect += clampedDelta(previous?.meaning_incorrect ?? 0, current.meaning_incorrect, id, 'meaning_incorrect')
    total.readingCorrect += clampedDelta(previous?.reading_correct ?? 0, current.reading_correct, id, 'reading_correct')
    total.readingIncorrect += clampedDelta(previous?.reading_incorrect ?? 0, current.reading_incorrect, id, 'reading_incorrect')
  }

  return total
}

// A lesson completion is started_at transitioning from unset to set; updates
// to already-started assignments (SRS moves, resurrects) are not lessons.
export function countNewLessons(changes: AssignmentChange[]): number {
  let lessons = 0
  for (const { previous, current } of changes) {
    if (current.started_at && !previous?.started_at) {
      lessons++
    }
  }
  return lessons
}

// Counts per SRS stage 0..9. Skips hidden and unstarted assignments to match
// calculateSRSDistribution, so the 5 named buckets remain derivable from this.
export function buildSrsStageSnapshot(assignments: Assignment[]): number[] {
  const snapshot = new Array<number>(SRS_STAGE_COUNT).fill(0)
  for (const assignment of assignments) {
    if (assignment.hidden || !assignment.started_at) continue
    const stage = assignment.srs_stage
    if (stage >= 0 && stage < SRS_STAGE_COUNT) {
      snapshot[stage]++
    }
  }
  return snapshot
}

// Accumulates review/lesson deltas into the day's row, replaces the SRS
// snapshot (latest of the day wins), and carries the baseline flag forward.
export function mergeIntoDayRow(
  existing: ActivityDayRow | undefined,
  date: string,
  input: {
    reviews?: ReviewActivityDelta
    lessons?: number
    srsSnapshot?: number[] | null
    baselineEstablished?: boolean
  },
  now: Date
): ActivityDayRow {
  const base: ActivityDayRow = existing ?? {
    date,
    reviews: { ...ZERO_DELTA },
    lessons: 0,
    srsSnapshot: null,
    updatedAt: now.toISOString(),
  }

  const row: ActivityDayRow = {
    ...base,
    reviews: input.reviews
      ? {
          meaningCorrect: base.reviews.meaningCorrect + input.reviews.meaningCorrect,
          meaningIncorrect: base.reviews.meaningIncorrect + input.reviews.meaningIncorrect,
          readingCorrect: base.reviews.readingCorrect + input.reviews.readingCorrect,
          readingIncorrect: base.reviews.readingIncorrect + input.reviews.readingIncorrect,
        }
      : base.reviews,
    lessons: base.lessons + (input.lessons ?? 0),
    srsSnapshot: input.srsSnapshot ?? base.srsSnapshot,
    updatedAt: now.toISOString(),
  }

  if (input.baselineEstablished || base.baseline) {
    row.baseline = true
  }

  return row
}
