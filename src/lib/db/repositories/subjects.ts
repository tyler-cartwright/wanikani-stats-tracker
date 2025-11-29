// src/lib/db/repositories/subjects.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchSubjects } from '@/lib/api/endpoints'
import type { Subject } from '@/lib/api/types'

export interface CachedSubject {
  id: number
  data: Subject
  updatedAt: string
}

export async function getCachedSubjects(): Promise<(Subject & { id: number })[]> {
  const cached = await getAll<CachedSubject>(STORES.SUBJECTS)
  return cached.map((item) => ({ ...item.data, id: item.id }))
}

export async function getSubjectCount(): Promise<number> {
  return count(STORES.SUBJECTS)
}

export async function syncSubjects(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  console.log('[REPO] syncSubjects started')
  const metadata = await getSyncMetadata()
  const cachedCount = await getSubjectCount()
  console.log('[REPO] Subjects - cached count:', cachedCount, 'metadata:', metadata.subjectsUpdatedAt)

  // Determine if we need a full sync or delta sync
  const isFullSync = cachedCount === 0 || !metadata.subjectsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.subjectsUpdatedAt
  console.log('[REPO] Subjects - isFullSync:', isFullSync, 'updatedAfter:', updatedAfter)

  onProgress?.(isFullSync ? 'Fetching all subjects...' : 'Checking for subject updates...')

  // Build endpoint with updated_after if doing delta sync
  console.log('[REPO] Calling fetchSubjectsWithFilter...')
  const subjects = await fetchSubjectsWithFilter(token, updatedAfter)
  console.log('[REPO] Fetched subjects count:', subjects.length)

  if (subjects.length === 0) {
    onProgress?.('Subjects up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${subjects.length} subjects...`)

  // Transform to cached format
  const cachedSubjects: CachedSubject[] = subjects.map((subject) => ({
    id: subject.id,
    data: subject,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.SUBJECTS, cachedSubjects)

  // Update sync metadata
  await updateSyncMetadata({
    subjectsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${subjects.length} subjects`)
  return { updated: subjects.length, isFullSync }
}

// Helper to fetch with updated_after filter
async function fetchSubjectsWithFilter(
  token: string,
  updatedAfter?: string | null
): Promise<(Subject & { id: number })[]> {
  // Note: This requires modifying fetchSubjects to accept updated_after
  // See Phase 4 for API layer updates
  return fetchSubjects(token, updatedAfter ?? undefined)
}
