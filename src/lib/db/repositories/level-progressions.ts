// src/lib/db/repositories/level-progressions.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchLevelProgressions } from '@/lib/api/endpoints'
import type { LevelProgression } from '@/lib/api/types'

export interface CachedLevelProgression {
  id: number
  level: number
  data: LevelProgression
  updatedAt: string
}

export async function getCachedLevelProgressions(): Promise<LevelProgression[]> {
  const cached = await getAll<CachedLevelProgression>(STORES.LEVEL_PROGRESSIONS)
  return cached.map((item) => item.data)
}

export async function getLevelProgressionCount(): Promise<number> {
  return count(STORES.LEVEL_PROGRESSIONS)
}

export async function syncLevelProgressions(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getLevelProgressionCount()

  const isFullSync = cachedCount === 0 || !metadata.levelProgressionsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.levelProgressionsUpdatedAt

  onProgress?.(
    isFullSync ? 'Fetching level progressions...' : 'Checking for level progression updates...'
  )

  const progressions = await fetchLevelProgressions(token, updatedAfter ?? undefined)

  if (progressions.length === 0) {
    onProgress?.('Level progressions up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${progressions.length} level progressions...`)

  const cachedProgressions: CachedLevelProgression[] = progressions.map((prog: any) => ({
    id: prog.id,
    level: prog.level,
    data: prog,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.LEVEL_PROGRESSIONS, cachedProgressions)

  await updateSyncMetadata({
    levelProgressionsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${progressions.length} level progressions`)
  return { updated: progressions.length, isFullSync }
}
