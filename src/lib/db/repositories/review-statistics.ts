// src/lib/db/repositories/review-statistics.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchReviewStatistics } from '@/lib/api/endpoints'
import type { ReviewStatistic } from '@/lib/api/types'

export interface CachedReviewStatistic {
  id: number
  subjectId: number
  data: ReviewStatistic
  updatedAt: string
}

export async function getCachedReviewStatistics(): Promise<ReviewStatistic[]> {
  const cached = await getAll<CachedReviewStatistic>(STORES.REVIEW_STATISTICS)
  return cached.map((item) => item.data)
}

export async function getReviewStatisticCount(): Promise<number> {
  return count(STORES.REVIEW_STATISTICS)
}

export async function syncReviewStatistics(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getReviewStatisticCount()

  const isFullSync = cachedCount === 0 || !metadata.reviewStatisticsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.reviewStatisticsUpdatedAt

  onProgress?.(
    isFullSync ? 'Fetching all review statistics...' : 'Checking for review statistic updates...'
  )

  const stats = await fetchReviewStatistics(token, updatedAfter ?? undefined)

  if (stats.length === 0) {
    onProgress?.('Review statistics up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${stats.length} review statistics...`)

  const cachedStats: CachedReviewStatistic[] = stats.map((stat: any) => ({
    id: stat.id,
    subjectId: stat.subject_id,
    data: stat,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.REVIEW_STATISTICS, cachedStats)

  await updateSyncMetadata({
    reviewStatisticsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${stats.length} review statistics`)
  return { updated: stats.length, isFullSync }
}
