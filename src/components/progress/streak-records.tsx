import { useState, useMemo } from 'react'
import { Flame, TrendingDown, ChevronRight } from 'lucide-react'
import { useAssignments, useSubjects, useReviewStatistics } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { calculateStreakRecords, enrichStreakItem } from '@/lib/calculations/streaks'
import type { ItemStreak } from '@/lib/calculations/streaks'
import { DrilldownModal } from '@/components/shared/drilldown-modal'
import { ItemDetailContent } from '@/components/shared/item-detail-content'
import type { LeechItem } from '@/lib/calculations/leeches'

type StreakListItem = LeechItem & Pick<ItemStreak, 'facet' | 'currentStreak' | 'maxStreak'>

export function StreakRecords() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const [openList, setOpenList] = useState<'hot' | 'broken' | null>(null)

  const isLoading = statsLoading || subjectsLoading || isSyncing

  const records = useMemo(() => {
    if (!reviewStats) return null
    return calculateStreakRecords(reviewStats)
  }, [reviewStats])

  const enrich = useMemo(() => {
    return (items: ItemStreak[]): StreakListItem[] => {
      if (!subjects || !reviewStats || !assignments) return []
      return items
        .map((item) => {
          const enriched = enrichStreakItem(item, subjects, reviewStats, assignments)
          return enriched
            ? {
                ...enriched,
                facet: item.facet,
                currentStreak: item.currentStreak,
                maxStreak: item.maxStreak,
              }
            : null
        })
        .filter((item): item is StreakListItem => item !== null)
    }
  }, [subjects, reviewStats, assignments])

  const enrichedHot = useMemo(
    () => (records ? enrich(records.hotStreaks) : []),
    [records, enrich]
  )
  const enrichedBroken = useMemo(
    () => (records ? enrich(records.recentlyBroken) : []),
    [records, enrich]
  )

  const longestEverSubject = useMemo(() => {
    if (!records?.longestEver || !subjects) return null
    return subjects.find((s) => s.id === records.longestEver!.subjectId) ?? null
  }, [records, subjects])

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Title */}
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />

        {/* Hero metric */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-3/4" />
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          <div className="h-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Nothing to celebrate until some reviews exist
  if (!records || !records.longestEver) {
    return null
  }

  const longest = records.longestEver
  const longestCharacter =
    longestEverSubject && 'characters' in longestEverSubject && longestEverSubject.characters
      ? longestEverSubject.characters
      : null

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-8">
        <Flame className="w-5 h-5 text-vermillion-500" />
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Streaks & Records
        </h2>
      </div>

      {/* Main metric: longest streak ever */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-4xl md:text-5xl font-display font-bold text-ink-100 dark:text-paper-100">
          {longest.maxStreak.toLocaleString()}
        </div>
        <div className="text-sm text-ink-400 dark:text-paper-300">
          longest answer streak ever
          {longestCharacter && (
            <>
              {' — '}
              <span className="text-lg font-japanese text-ink-100 dark:text-paper-100">
                {longestCharacter}
              </span>{' '}
              ({longest.facet})
            </>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => records.totalOnHotStreak > 0 && setOpenList('hot')}
          disabled={records.totalOnHotStreak === 0}
          className="text-left bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-3 enabled:hover:bg-paper-300 enabled:dark:hover:bg-ink-300 transition-smooth group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-400 dark:text-paper-300 mb-1">
                On 20+ answer streaks
              </div>
              <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
                {records.totalOnHotStreak.toLocaleString()} item
                {records.totalOnHotStreak === 1 ? '' : 's'}
              </div>
            </div>
            {records.totalOnHotStreak > 0 && (
              <ChevronRight className="w-4 h-4 text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100 transition-smooth" />
            )}
          </div>
        </button>
        <button
          onClick={() => records.recentlyBroken.length > 0 && setOpenList('broken')}
          disabled={records.recentlyBroken.length === 0}
          className="text-left bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-3 enabled:hover:bg-paper-300 enabled:dark:hover:bg-ink-300 transition-smooth group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-400 dark:text-paper-300 mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-vermillion-500 dark:text-vermillion-400" />
                Recently broken long streaks
              </div>
              <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
                {records.recentlyBroken.length.toLocaleString()} item
                {records.recentlyBroken.length === 1 ? '' : 's'}
              </div>
            </div>
            {records.recentlyBroken.length > 0 && (
              <ChevronRight className="w-4 h-4 text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100 transition-smooth" />
            )}
          </div>
        </button>
      </div>

      {/* Drill-down modal (hot or broken list) */}
      <DrilldownModal
        isOpen={openList !== null}
        onClose={() => setOpenList(null)}
        title={openList === 'broken' ? 'Recently Broken Streaks' : 'Hot Streaks'}
        description={
          openList === 'broken'
            ? 'These items just lost a long correct-answer streak — worth a quick refresher before they slide further. Click any item for details.'
            : 'Items you have answered correctly 20 or more times in a row. Click any item for details.'
        }
        items={openList === 'broken' ? enrichedBroken : enrichedHot}
        renderListItem={(item, onClick) => (
          <div
            onClick={onClick}
            className="flex items-center justify-between p-3 bg-paper-300/50 dark:bg-ink-300/50 rounded-lg hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer group"
          >
            <div className="flex items-center gap-3 flex-1">
              {item.character && <div className="text-2xl font-japanese">{item.character}</div>}
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                  {item.meaning}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  Level {item.level} · {item.type} · {item.facet}
                </div>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <div className="text-xs font-medium text-vermillion-500 dark:text-vermillion-400">
                  {openList === 'broken'
                    ? `was ${item.maxStreak} in a row`
                    : `${item.currentStreak} in a row`}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  {openList === 'broken'
                    ? `now ${item.currentStreak}`
                    : `best ${item.maxStreak}`}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100 transition-smooth" />
            </div>
          </div>
        )}
        renderDetail={(item) => <ItemDetailContent item={item} />}
      />
    </div>
  )
}
