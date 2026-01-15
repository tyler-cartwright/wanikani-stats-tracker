import { useState, useMemo } from 'react'
import { Shield, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAssignments, useSubjects, useReviewStatistics } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { calculateKnowledgeStability, enrichAtRiskItem } from '@/lib/calculations/knowledge-stability'
import { DrilldownModal } from '@/components/shared/drilldown-modal'
import { ItemDetailContent } from '@/components/shared/item-detail-content'
import type { LeechItem } from '@/lib/calculations/leeches'

export function KnowledgeStability() {
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: reviewStats } = useReviewStatistics()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const [showAtRisk, setShowAtRisk] = useState(false)
  const [atRiskLimit, setAtRiskLimit] = useState<10 | 25 | 50 | 'all'>(25)

  const isLoading = assignmentsLoading || subjectsLoading || isSyncing

  const stability = useMemo(() => {
    if (!assignments || !subjects) return null
    return calculateKnowledgeStability(assignments, subjects)
  }, [assignments, subjects])

  // Enrich at-risk items with full details for the modal
  const enrichedAtRiskItems = useMemo(() => {
    if (!stability || !subjects || !reviewStats) return []
    return stability.atRiskItems
      .map((item) => enrichAtRiskItem(item, subjects, reviewStats))
      .filter((item): item is LeechItem => item !== null)
  }, [stability, subjects, reviewStats])

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

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse mb-2" />
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            <div className="h-3 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          </div>
        </div>

        {/* At-risk button */}
        <div className="border-t border-paper-300 dark:border-ink-300 pt-4 mt-6">
          <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!stability) {
    return null
  }

  const solidPercent = stability.totalPassed > 0 ? (stability.solidItems / stability.totalPassed) * 100 : 0
  const fragilePercent = stability.totalPassed > 0 ? (stability.fragileItems / stability.totalPassed) * 100 : 0
  const stabilityPercent = Math.round(stability.stabilityRatio * 100)

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="w-5 h-5 text-patina-500" />
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Knowledge Stability
        </h2>
      </div>

      {/* Main metric: Stability ratio as percentage */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-4xl md:text-5xl font-display font-bold text-ink-100 dark:text-paper-100">
          {stabilityPercent}%
        </div>
        <div className="text-sm text-ink-400 dark:text-paper-300">
          of passed items remain at Guru or above
        </div>
      </div>

      {/* Visual breakdown: Solid vs Fragile bar */}
      <div className="mb-4">
        <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-paper-300 dark:bg-ink-300">
          {solidPercent > 0 && (
            <div
              className="bg-patina-500 dark:bg-patina-400 transition-all"
              style={{ width: `${solidPercent}%` }}
            />
          )}
          {fragilePercent > 0 && (
            <div
              className="bg-vermillion-500 dark:bg-vermillion-400 transition-all"
              style={{ width: `${fragilePercent}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-patina-600 dark:text-patina-500 font-medium">
            {stability.solidItems.toLocaleString()} solid
          </span>
          <span className="text-vermillion-500 dark:text-vermillion-400 font-medium">
            {stability.fragileItems.toLocaleString()} fragile
          </span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-3">
          <div className="text-xs text-ink-400 dark:text-paper-300 mb-1">Radicals</div>
          <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
            {stability.byType.radical.total > 0
              ? Math.round((stability.byType.radical.solid / stability.byType.radical.total) * 100)
              : 0}
            % stable
          </div>
        </div>
        <div className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-3">
          <div className="text-xs text-ink-400 dark:text-paper-300 mb-1">Kanji</div>
          <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
            {stability.byType.kanji.total > 0
              ? Math.round((stability.byType.kanji.solid / stability.byType.kanji.total) * 100)
              : 0}
            % stable
          </div>
        </div>
        <div className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-3">
          <div className="text-xs text-ink-400 dark:text-paper-300 mb-1">Vocabulary</div>
          <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
            {stability.byType.vocabulary.total > 0
              ? Math.round((stability.byType.vocabulary.solid / stability.byType.vocabulary.total) * 100)
              : 0}
            % stable
          </div>
        </div>
      </div>

      {/* At-risk items preview */}
      {stability.atRiskItems.length > 0 && (
        <div className="border-t border-paper-300 dark:border-ink-300 pt-4">
          <button
            onClick={() => setShowAtRisk(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-md bg-vermillion-500/10 dark:bg-vermillion-400/10 hover:bg-vermillion-500/20 dark:hover:bg-vermillion-400/20 transition-smooth group"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-vermillion-500 dark:text-vermillion-400" />
              <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
                View {stability.atRiskItems.length.toLocaleString()} at-risk items
              </span>
            </div>
            <span className="text-xs text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100">
              →
            </span>
          </button>
        </div>
      )}

      {/* At-risk items modal with drill-down */}
      <DrilldownModal
        isOpen={showAtRisk}
        onClose={() => setShowAtRisk(false)}
        title="At-Risk Items"
        description="These items passed Guru but have fallen back. They're most likely to become leeches. Click any item to view detailed information, readings, and accuracy stats."
        items={enrichedAtRiskItems.slice(0, atRiskLimit === 'all' ? undefined : atRiskLimit)}
        renderListItem={(item, onClick) => (
          <div
            onClick={onClick}
            className="flex items-center justify-between p-3 bg-paper-300/50 dark:bg-ink-300/50 rounded-lg hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer group"
          >
            <div className="flex items-center gap-3 flex-1">
              {item.character && (
                <div className="text-2xl font-japanese">{item.character}</div>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                  {item.meaning}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  Level {item.level} · {item.type}
                </div>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <div className="text-xs font-medium text-vermillion-500 dark:text-vermillion-400">
                  SRS {item.currentSRS}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  {item.accuracy}% accuracy
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100 transition-smooth" />
            </div>
          </div>
        )}
        renderDetail={(item) => <ItemDetailContent item={item} />}
        listHeaderContent={
          <div className="flex gap-2 mb-4">
            <span className="text-xs text-ink-400 dark:text-paper-300 self-center mr-2">Show:</span>
            <div className="flex gap-1 bg-paper-300 dark:bg-ink-300 rounded-lg p-1">
              {([10, 25, 50, 'all'] as const).map((limit) => (
                <button
                  key={limit}
                  onClick={() => setAtRiskLimit(limit)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-smooth',
                    atRiskLimit === limit
                      ? 'bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 shadow-sm'
                      : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
                  )}
                >
                  {limit === 'all' ? 'All' : limit}
                </button>
              ))}
            </div>
          </div>
        }
      />
    </div>
  )
}
