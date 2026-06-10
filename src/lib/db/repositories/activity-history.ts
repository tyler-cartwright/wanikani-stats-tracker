// src/lib/db/repositories/activity-history.ts
//
// Per-day captured study activity (review/lesson deltas + SRS snapshots).
// WaniKani removed GET /reviews in 2023, so these rows are forward-only and
// irreplaceable: nothing here (or anywhere) may clear the store except a full
// logout, and force-sync explicitly preserves it.
import { count, getAll, getById, putMany, putOne } from '../database'
import { STORES, type ActivityDayRow } from '../schema'
import {
  buildSrsStageSnapshot,
  computeReviewDeltas,
  countNewLessons,
  formatLocalDate,
  mergeIntoDayRow,
  type AssignmentChange,
  type ReviewStatChange,
} from '@/lib/calculations/activity-capture'
import { getCachedAssignments, getAssignmentCount } from './assignments'

export async function getActivityHistory(): Promise<ActivityDayRow[]> {
  // 'YYYY-MM-DD' keys sort lexicographically, so getAll is already chronological
  return getAll<ActivityDayRow>(STORES.ACTIVITY_HISTORY)
}

export async function getActivityDay(date: string): Promise<ActivityDayRow | undefined> {
  return getById<ActivityDayRow>(STORES.ACTIVITY_HISTORY, date)
}

export async function putActivityDays(rows: ActivityDayRow[]): Promise<void> {
  return putMany(STORES.ACTIVITY_HISTORY, rows)
}

export async function getActivityDayCount(): Promise<number> {
  return count(STORES.ACTIVITY_HISTORY)
}

export interface RecordSyncActivityInput {
  // undefined = that collection's sync failed or was a full (no-baseline)
  // sync; its facet of the day row is left untouched
  statChanges?: ReviewStatChange[]
  statsFullSync: boolean
  assignmentChanges?: AssignmentChange[]
  assignmentsFullSync: boolean
  now?: Date // injectable for tests
}

// Called once per performSync, after the parallel collection syncs settle —
// a single sequential read-modify-write of today's row, so concurrent
// collection syncs can't race each other on it.
export async function recordSyncActivity(input: RecordSyncActivityInput): Promise<void> {
  const now = input.now ?? new Date()
  const date = formatLocalDate(now)
  const existing = await getActivityDay(date)

  const reviews = input.statChanges ? computeReviewDeltas(input.statChanges) : undefined
  const lessons = input.assignmentChanges ? countNewLessons(input.assignmentChanges) : undefined

  // Snapshot the SRS distribution from the freshly-updated cache; skip when
  // the assignments store is empty (e.g. a fresh install whose assignment
  // sync failed) so we never record an all-zeros snapshot.
  let srsSnapshot: number[] | undefined
  if ((await getAssignmentCount()) > 0) {
    srsSnapshot = buildSrsStageSnapshot(await getCachedAssignments())
  }

  const row = mergeIntoDayRow(
    existing,
    date,
    {
      reviews,
      lessons,
      srsSnapshot,
      baselineEstablished: input.statsFullSync || input.assignmentsFullSync,
    },
    now
  )

  await putOne(STORES.ACTIVITY_HISTORY, row)
}
