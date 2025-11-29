// src/lib/db/sync-metadata.ts
import { getById, putOne } from './database'
import { STORES, type SyncMetadata } from './schema'

const METADATA_ID = 'sync_metadata'

const DEFAULT_METADATA: SyncMetadata = {
  id: METADATA_ID,
  subjectsUpdatedAt: null,
  assignmentsUpdatedAt: null,
  reviewStatisticsUpdatedAt: null,
  levelProgressionsUpdatedAt: null,
  lastFullSync: null,
}

export async function getSyncMetadata(): Promise<SyncMetadata> {
  const metadata = await getById<SyncMetadata>(STORES.SYNC_METADATA, METADATA_ID)
  return metadata ?? DEFAULT_METADATA
}

export async function updateSyncMetadata(
  updates: Partial<Omit<SyncMetadata, 'id'>>
): Promise<void> {
  const current = await getSyncMetadata()
  await putOne(STORES.SYNC_METADATA, { ...current, ...updates })
}

export async function resetSyncMetadata(): Promise<void> {
  await putOne(STORES.SYNC_METADATA, DEFAULT_METADATA)
}
