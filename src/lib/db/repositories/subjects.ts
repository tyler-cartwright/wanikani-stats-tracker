// src/lib/db/repositories/subjects.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchSubjects } from '@/lib/api/endpoints'
import { debugLog } from '@/lib/utils/debug-log'
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
  debugLog('[REPO] syncSubjects started')
  const metadata = await getSyncMetadata()
  const cachedCount = await getSubjectCount()
  debugLog('[REPO] Subjects - cached count:', cachedCount, 'metadata:', metadata.subjectsUpdatedAt)

  // Determine if we need a full sync or delta sync
  const isFullSync = cachedCount === 0 || !metadata.subjectsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.subjectsUpdatedAt
  debugLog('[REPO] Subjects - isFullSync:', isFullSync, 'updatedAfter:', updatedAfter)

  onProgress?.(isFullSync ? 'Fetching all subjects...' : 'Checking for subject updates...')

  // Fallback delta cursor if the API response carries no data_updated_at;
  // captured before the fetch so updates landing mid-sync aren't skipped
  const fetchStartedAt = new Date().toISOString()
  const { data: subjects, dataUpdatedAt } = await fetchSubjects(token, updatedAfter ?? undefined)
  debugLog('[REPO] Fetched subjects count:', subjects.length)

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

  // Update sync metadata using the server-side collection timestamp
  await updateSyncMetadata({
    subjectsUpdatedAt: dataUpdatedAt ?? fetchStartedAt,
  })

  onProgress?.(`Updated ${subjects.length} subjects`)
  return { updated: subjects.length, isFullSync }
}
