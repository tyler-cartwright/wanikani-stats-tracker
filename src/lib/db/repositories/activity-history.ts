// src/lib/db/repositories/activity-history.ts
//
// Per-day captured study activity (review/lesson deltas + SRS snapshots).
// WaniKani removed GET /reviews in 2023, so these rows are forward-only and
// irreplaceable: nothing here (or anywhere) may clear the store except a full
// logout, and force-sync explicitly preserves it.
import { count, getAll, getById, putMany } from '../database'
import { STORES, type ActivityDayRow } from '../schema'

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
