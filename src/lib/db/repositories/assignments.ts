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

  const assignments = await fetchAssignments(token, updatedAfter ?? undefined)

  if (assignments.length === 0) {
    onProgress?.('Assignments up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${assignments.length} assignments...`)

  // Need to extract ID from the fetched data
  // Note: fetchAssignments returns Assignment[], but we need IDs
  // See Phase 4 for API modifications
  const cachedAssignments: CachedAssignment[] = assignments.map((assignment: any) => ({
    id: assignment.id,
    subjectId: assignment.subject_id,
    data: assignment,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.ASSIGNMENTS, cachedAssignments)

  await updateSyncMetadata({
    assignmentsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${assignments.length} assignments`)
  return { updated: assignments.length, isFullSync }
}
