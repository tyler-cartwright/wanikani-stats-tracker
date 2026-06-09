// src/lib/db/repositories/assignments.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchAssignments } from '@/lib/api/endpoints'
import type { Assignment } from '@/lib/api/types'

export interface CachedAssignment {
  id: number
  subjectId: number
  data: Assignment
  updatedAt: string
}

export async function getCachedAssignments(): Promise<Assignment[]> {
  const cached = await getAll<CachedAssignment>(STORES.ASSIGNMENTS)
  return cached.map((item) => item.data)
}

export async function getAssignmentCount(): Promise<number> {
  return count(STORES.ASSIGNMENTS)
}

export async function syncAssignments(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getAssignmentCount()

  const isFullSync = cachedCount === 0 || !metadata.assignmentsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.assignmentsUpdatedAt

  onProgress?.(isFullSync ? 'Fetching all assignments...' : 'Checking for assignment updates...')

  // Fallback delta cursor if the API response carries no data_updated_at;
  // captured before the fetch so updates landing mid-sync aren't skipped
  const fetchStartedAt = new Date().toISOString()
  const { data: assignments, dataUpdatedAt } = await fetchAssignments(token, updatedAfter ?? undefined)

  if (assignments.length === 0) {
    onProgress?.('Assignments up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${assignments.length} assignments...`)

  const cachedAssignments: CachedAssignment[] = assignments.map((assignment) => ({
    id: assignment.id,
    subjectId: assignment.subject_id,
    data: assignment,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.ASSIGNMENTS, cachedAssignments)

  // Update sync metadata using the server-side collection timestamp
  await updateSyncMetadata({
    assignmentsUpdatedAt: dataUpdatedAt ?? fetchStartedAt,
  })

  onProgress?.(`Updated ${assignments.length} assignments`)
  return { updated: assignments.length, isFullSync }
}
