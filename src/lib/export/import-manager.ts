/**
 * Import Manager
 *
 * Restores captured activity history from a previously exported backup.
 * Scope is deliberately activity history only: every other collection can be
 * re-downloaded by syncing, but activity history is forward-only and
 * irreplaceable. Parsing and merging are pure functions; only
 * importActivityHistory touches IndexedDB. No network anywhere.
 */

import {
  getActivityHistory,
  putActivityDays,
} from '@/lib/db/repositories/activity-history'
import type { ActivityDayRow } from '@/lib/db/schema'
import type { ImportSummary } from './export-types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function asNonNegativeCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  // Clamp instead of reject: a clamped negative loses nothing real, and the
  // row's other facets may carry valid history
  return Math.max(0, value)
}

function validateRow(raw: unknown): ActivityDayRow | null {
  if (typeof raw !== 'object' || raw === null) return null
  const row = raw as Record<string, unknown>

  if (typeof row.date !== 'string' || !DATE_PATTERN.test(row.date)) return null

  const reviewsRaw = row.reviews
  if (typeof reviewsRaw !== 'object' || reviewsRaw === null) return null
  const reviews = reviewsRaw as Record<string, unknown>

  const meaningCorrect = asNonNegativeCount(reviews.meaningCorrect)
  const meaningIncorrect = asNonNegativeCount(reviews.meaningIncorrect)
  const readingCorrect = asNonNegativeCount(reviews.readingCorrect)
  const readingIncorrect = asNonNegativeCount(reviews.readingIncorrect)
  const lessons = asNonNegativeCount(row.lessons)
  if (
    meaningCorrect === null ||
    meaningIncorrect === null ||
    readingCorrect === null ||
    readingIncorrect === null ||
    lessons === null
  ) {
    return null
  }

  let srsSnapshot: number[] | null = null
  if (row.srsSnapshot !== null && row.srsSnapshot !== undefined) {
    if (
      !Array.isArray(row.srsSnapshot) ||
      row.srsSnapshot.length !== 10 ||
      row.srsSnapshot.some((n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0)
    ) {
      return null
    }
    srsSnapshot = row.srsSnapshot as number[]
  }

  const validated: ActivityDayRow = {
    date: row.date,
    reviews: { meaningCorrect, meaningIncorrect, readingCorrect, readingIncorrect },
    lessons,
    srsSnapshot,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
  }
  if (row.baseline === true) {
    validated.baseline = true
  }
  return validated
}

/**
 * Parse an import file. Accepts either a full export envelope (reads
 * data.activityHistory) or a bare array of day rows. Malformed individual
 * rows are dropped; a structurally wrong file throws a descriptive error.
 */
export function parseActivityImport(text: string): ActivityDayRow[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Not a valid JSON file')
  }

  let rows: unknown
  if (Array.isArray(parsed)) {
    rows = parsed
  } else if (typeof parsed === 'object' && parsed !== null) {
    rows = (parsed as { data?: { activityHistory?: unknown } }).data?.activityHistory
    if (rows === undefined) {
      throw new Error('File contains no activity history (data.activityHistory missing)')
    }
  } else {
    throw new Error('Unrecognized file format')
  }

  if (!Array.isArray(rows)) {
    throw new Error('Activity history in file is not a list of day rows')
  }

  return rows
    .map(validateRow)
    .filter((row): row is ActivityDayRow => row !== null)
}

function reviewTotal(row: ActivityDayRow): number {
  return (
    row.reviews.meaningCorrect +
    row.reviews.meaningIncorrect +
    row.reviews.readingCorrect +
    row.reviews.readingIncorrect
  )
}

/**
 * Merge imported day rows into existing history: union of dates; on a date
 * conflict the row with the larger review total wins wholesale (ties keep
 * the existing row), so re-importing the same backup is a no-op. A backup is
 * normally a strict subset or superset of local history, never a partial
 * overlap — keeping the larger row preserves whichever side has more.
 */
export function mergeActivityHistory(
  existing: ActivityDayRow[],
  imported: ActivityDayRow[]
): {
  merged: ActivityDayRow[]
  summary: Pick<ImportSummary, 'daysInFile' | 'newDays' | 'conflictsKeptExisting' | 'conflictsTookImported'>
} {
  const byDate = new Map<string, ActivityDayRow>()
  for (const row of existing) {
    byDate.set(row.date, row)
  }

  let newDays = 0
  let conflictsKeptExisting = 0
  let conflictsTookImported = 0

  for (const incoming of imported) {
    const current = byDate.get(incoming.date)
    if (!current) {
      byDate.set(incoming.date, incoming)
      newDays++
      continue
    }

    const winner = reviewTotal(incoming) > reviewTotal(current) ? incoming : current
    const loser = winner === incoming ? current : incoming

    const resolved: ActivityDayRow = {
      ...winner,
      // The snapshot is independent of review totals — backfill it from the
      // losing row rather than losing it
      srsSnapshot: winner.srsSnapshot ?? loser.srsSnapshot,
    }
    if (winner.baseline || loser.baseline) {
      resolved.baseline = true
    }
    byDate.set(incoming.date, resolved)

    if (winner === incoming) {
      conflictsTookImported++
    } else {
      conflictsKeptExisting++
    }
  }

  const merged = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))

  return {
    merged,
    summary: {
      daysInFile: imported.length,
      newDays,
      conflictsKeptExisting,
      conflictsTookImported,
    },
  }
}

/**
 * Import activity history from a backup file's text content.
 */
export async function importActivityHistory(fileText: string): Promise<ImportSummary> {
  try {
    const imported = parseActivityImport(fileText)
    if (imported.length === 0) {
      return {
        success: false,
        daysInFile: 0,
        newDays: 0,
        conflictsKeptExisting: 0,
        conflictsTookImported: 0,
        error: 'File contains no valid activity history rows',
      }
    }

    const existing = await getActivityHistory()
    const { merged, summary } = mergeActivityHistory(existing, imported)
    await putActivityDays(merged)

    return { success: true, ...summary }
  } catch (error) {
    console.error('[IMPORT] Activity history import failed:', error)
    return {
      success: false,
      daysInFile: 0,
      newDays: 0,
      conflictsKeptExisting: 0,
      conflictsTookImported: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
