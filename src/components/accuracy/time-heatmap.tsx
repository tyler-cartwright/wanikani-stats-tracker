import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react'
import { useReviewStatistics, useSubjects } from '@/lib/api/queries'
import type { ReviewStatistic, Subject } from '@/lib/api/types'
import { useSyncStore } from '@/stores/sync-store'

interface LevelData {
  level: number
  accuracy: number
  itemCount: number
}

const getAccuracyColor = (accuracy: number): string => {
  // Low accuracy → vermillion, mid → paper tones, high → patina
  if (accuracy >= 90) return 'bg-patina-500 dark:bg-patina-400'
  if (accuracy >= 85) return 'bg-patina-500/80 dark:bg-patina-400/80'
  if (accuracy >= 80) return 'bg-paper-400 dark:bg-paper-400/60'
  if (accuracy >= 75) return 'bg-paper-400/70 dark:bg-paper-400/50'
  if (accuracy >= 70) return 'bg-vermillion-500/50 dark:bg-vermillion-400/50'
  if (accuracy >= 60) return 'bg-vermillion-500/70 dark:bg-vermillion-400/70'
  return 'bg-vermillion-500 dark:bg-vermillion-400'
}

function calculateAccuracyByLevel(
  reviewStats: ReviewStatistic[],
  subjects: (Subject & { id: number })[]
): LevelData[] {
  // Create a map of subject_id -> level
  const subjectLevelMap = new Map<number, number>()
  subjects.forEach((subject) => {
    if ('level' in subject) {
      subjectLevelMap.set(subject.id, subject.level)
    }
  })

  // Group review statistics by level
  const levelMap = new Map<number, { totalAccuracy: number; count: number }>()

  reviewStats.forEach((stat) => {
    const level = subjectLevelMap.get(stat.subject_id)
    if (!level) return // Skip if we don't have level info

    if (!levelMap.has(level)) {
      levelMap.set(level, { totalAccuracy: 0, count: 0 })
    }

    const data = levelMap.get(level)!
    data.totalAccuracy += stat.percentage_correct
    data.count += 1
  })

  // Convert to array and calculate averages
  const levelData: LevelData[] = []
  levelMap.forEach((data, level) => {
    levelData.push({
      level,
      accuracy: Math.round(data.totalAccuracy / data.count),
      itemCount: data.count,
    })
  })

  // Sort by level
  return levelData.sort((a, b) => a.level - b.level)
}

export function TimeHeatmap() {
  const { data: reviewStats, isLoading: isLoadingStats } = useReviewStatistics()
  const { data: subjects, isLoading: isLoadingSubjects } = useSubjects()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const levelData = useMemo(() => {
    if (!reviewStats || !subjects) return []
    return calculateAccuracyByLevel(reviewStats, subjects)
  }, [reviewStats, subjects])

  const bestLevel = useMemo(() => {
    if (levelData.length === 0) return null
    return levelData.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    )
  }, [levelData])

  const worstLevel = useMemo(() => {
    if (levelData.length === 0) return null
    return levelData.reduce((worst, current) =>
      current.accuracy < worst.accuracy ? current : worst
    )
  }, [levelData])

  const isLoading = isLoadingStats || isLoadingSubjects || isSyncing

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-ink-400 dark:text-paper-300">
            Loading accuracy by level...
          </div>
        </div>
      </div>
    )
  }

  if (!levelData || levelData.length === 0) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
              No Level Data
            </div>
            <div className="text-sm text-ink-400 dark:text-paper-300">
              Complete some reviews to see accuracy by level
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Accuracy by Level
        </h2>
        <div className="flex items-center gap-2 text-sm text-ink-400 dark:text-paper-300">
          <span className="font-medium">{levelData.length} levels</span>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-2 mb-6">
        {levelData.map((item) => (
          <div key={item.level} className="flex items-center gap-3">
            <div className="w-12 text-right text-sm font-medium text-ink-400 dark:text-paper-300">
              Lvl {item.level}
            </div>
            <div className="flex-1 relative">
              <div
                className={cn(
                  'h-8 rounded-md transition-smooth cursor-help flex items-center justify-end px-3',
                  getAccuracyColor(item.accuracy)
                )}
                style={{ width: `${item.accuracy}%` }}
                title={`Level ${item.level}: ${item.accuracy}% (${item.itemCount} items)`}
              >
                <span className="text-xs font-semibold text-white dark:text-ink-100">
                  {item.accuracy}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      {bestLevel && worstLevel && (
        <div className="flex flex-wrap gap-6 text-sm mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-patina-500 dark:text-patina-400" />
            <span className="text-ink-400 dark:text-paper-300">Best:</span>{' '}
            <span className="text-patina-500 dark:text-patina-400 font-semibold">
              Level {bestLevel.level} ({bestLevel.accuracy}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-vermillion-500 dark:text-vermillion-400" />
            <span className="text-ink-400 dark:text-paper-300">Worst:</span>{' '}
            <span className="text-vermillion-500 dark:text-vermillion-400 font-semibold">
              Level {worstLevel.level} ({worstLevel.accuracy}%)
            </span>
          </div>
        </div>
      )}

      {/* Insight */}
      {worstLevel && worstLevel.accuracy < 80 && (
        <div className="p-4 bg-vermillion-500/10 dark:bg-vermillion-500/20 border border-vermillion-500/20 dark:border-vermillion-500/30 rounded-lg">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-vermillion-500 dark:text-vermillion-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-ink-100 dark:text-paper-100">
              Level {worstLevel.level} needs attention ({worstLevel.accuracy}% accuracy).
              Review these items more frequently to improve retention.
            </div>
          </div>
        </div>
      )}
      {worstLevel && worstLevel.accuracy >= 80 && (
        <div className="p-4 bg-patina-500/10 dark:bg-patina-500/20 border border-patina-500/20 dark:border-patina-500/30 rounded-lg">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-patina-500 dark:text-patina-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-ink-100 dark:text-paper-100">
              Great consistency! All levels are above 80% accuracy. Keep up the excellent work.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
