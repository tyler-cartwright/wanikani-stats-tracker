// src/lib/db/repositories/review-statistics.ts
import { getAll, getMany, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchReviewStatistics } from '@/lib/api/endpoints'
import type { ReviewStatistic } from '@/lib/api/types'
import type { ReviewStatChange } from '@/lib/calculations/activity-capture'

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
): Promise<{ updated: number; isFullSync: boolean; changes?: ReviewStatChange[] }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getReviewStatisticCount()

  const isFullSync = cachedCount === 0 || !metadata.reviewStatisticsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.reviewStatisticsUpdatedAt

  onProgress?.(
    isFullSync ? 'Fetching all review statistics...' : 'Checking for review statistic updates...'
  )

  // Fallback delta cursor if the API response carries no data_updated_at;
  // captured before the fetch so updates landing mid-sync aren't skipped
  const fetchStartedAt = new Date().toISOString()
  const { data: stats, dataUpdatedAt } = await fetchReviewStatistics(token, updatedAfter ?? undefined)

  if (stats.length === 0) {
    onProgress?.('Review statistics up to date')
    return { updated: 0, isFullSync, changes: [] }
  }

  // Capture old totals before putMany overwrites them so activity capture can
  // diff. Deliberately skipped on full syncs: there is no baseline to diff
  // against (diffing lifetime totals would bucket years of history into
  // "today"), and collecting thousands of previous rows wastes memory.
  let changes: ReviewStatChange[] | undefined
  if (!isFullSync) {
    const previous = await getMany<CachedReviewStatistic>(
      STORES.REVIEW_STATISTICS,
      stats.map((s) => s.id)
    )
    changes = stats.map((stat, i) => ({ previous: previous[i]?.data, current: stat }))
  }

  onProgress?.(`Saving ${stats.length} review statistics...`)

  const cachedStats: CachedReviewStatistic[] = stats.map((stat) => ({
    id: stat.id,
    subjectId: stat.subject_id,
    data: stat,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.REVIEW_STATISTICS, cachedStats)

  // Update sync metadata using the server-side collection timestamp
  await updateSyncMetadata({
    reviewStatisticsUpdatedAt: dataUpdatedAt ?? fetchStartedAt,
  })

  onProgress?.(`Updated ${stats.length} review statistics`)
  return { updated: stats.length, isFullSync, changes }
}
