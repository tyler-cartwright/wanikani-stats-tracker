import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ChevronRight, Lock, PartyPopper, Trophy } from 'lucide-react'
import {
  useAssignments,
  useReviewStatistics,
  useSubjects,
  useUser,
} from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import {
  calculateLevelUpBlockers,
  enrichBlockerItem,
} from '@/lib/calculations/level-up-blockers'
import type { LevelUpBlocker } from '@/lib/calculations/level-up-blockers'
import { formatDurationCompact } from '@/lib/calculations/level-progress'
import { getSRSStageName } from '@/lib/api/types'
import { SRSBadge } from '@/components/shared/srs-badge'
import { DrilldownModal } from '@/components/shared/drilldown-modal'
import { ItemDetailContent } from '@/components/shared/item-detail-content'
import { InfoTooltip } from '@/components/shared/info-tooltip'

const MAX_PREVIEW_CHIPS = 8

// Same apprentice shading convention as the JLPT item grid
function chipClasses(blocker: LevelUpBlocker): string {
  if (blocker.isLocked || blocker.srsStage === 0) {
    return 'bg-paper-300/60 dark:bg-ink-300/60 text-ink-400 dark:text-paper-300 border border-dashed border-paper-400 dark:border-ink-400'
  }
  if (blocker.srsStage === 1) return 'bg-srs-apprentice/40 text-ink-100 dark:text-paper-100'
  if (blocker.srsStage === 2) return 'bg-srs-apprentice/60 text-ink-100 dark:text-paper-100'
  if (blocker.srsStage === 3) return 'bg-srs-apprentice/80 text-ink-100 dark:text-paper-100'
  return 'bg-srs-apprentice text-ink-100'
}

function formatGuruEta(date: Date, now: Date): string {
  const ms = date.getTime() - now.getTime()
  if (ms <= 0) return 'next review'
  return `in ${formatDurationCompact(ms)}`
}

export function LevelUpBlockers() {
  const { data: user } = useUser()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: reviewStats } = useReviewStatistics()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isLoading = assignmentsLoading || subjectsLoading || isSyncing

  const { result, now } = useMemo(() => {
    if (!assignments || !subjects || !user) return { result: null, now: new Date() }
    const now = new Date()
    return {
      result: calculateLevelUpBlockers(assignments, subjects, user.level, now),
      now,
    }
  }, [assignments, subjects, user])

  // Skeleton both while loading and before any data exists (first sync pending),
  // matching the other dashboard cards
  if (isLoading || !result || !user) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8 w-1/3" />
        <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4 w-1/2" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const atMaxLevel = user.level >= 60
  const subscriptionCapped =
    !atMaxLevel && user.level >= user.subscription.max_level_granted

  const previewChips = result.blockers
    .filter((b) => b.isCritical)
    .slice(0, MAX_PREVIEW_CHIPS)

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Level-Up Blockers
        </h2>
        <InfoTooltip content="Earliest possible level-up assumes every review is answered correctly the moment it becomes available, on standard SRS timings. Locked kanji wait for their radicals to reach Guru first." />
      </div>

      {atMaxLevel ? (
        <div className="flex items-center gap-3 text-sm text-ink-400 dark:text-paper-300">
          <Trophy className="w-5 h-5 text-vermillion-500 dark:text-vermillion-400" />
          <span>
            Level 60 — the mountain is climbed. Nothing left to block; only burns remain.
          </span>
        </div>
      ) : result.kanjiNeeded === 0 ? (
        <div className="flex items-center gap-3 text-sm text-ink-100 dark:text-paper-100">
          <PartyPopper className="w-5 h-5 text-vermillion-500 dark:text-vermillion-400" />
          <span>
            Level-up requirement met — {result.kanjiPassed} of {result.kanjiTotal} kanji passed.
            Your new level should arrive with the next sync.
          </span>
        </div>
      ) : (
        <>
          {/* Headline */}
          <div className="mb-2">
            <span className="text-4xl md:text-5xl font-display font-bold text-vermillion-500 dark:text-vermillion-400">
              {result.kanjiNeeded}
            </span>
            <span className="ml-3 text-sm text-ink-400 dark:text-paper-300">
              more {result.kanjiNeeded === 1 ? 'kanji needs' : 'kanji need'} to reach Guru ·{' '}
              {result.kanjiPassed}/{result.kanjiTotal} passed
            </span>
          </div>

          {result.earliestLevelUpAt && (
            <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">
              Earliest possible level-up:{' '}
              <span className="font-semibold text-ink-100 dark:text-paper-100">
                {format(result.earliestLevelUpAt, 'EEE, MMM d · p')}
              </span>{' '}
              <span className="text-patina-500 dark:text-patina-400 font-medium">
                ({formatGuruEta(result.earliestLevelUpAt, now)})
              </span>
            </p>
          )}

          {/* Critical kanji preview */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {previewChips.map((blocker) => (
              <button
                key={blocker.subjectId}
                onClick={() => setIsModalOpen(true)}
                title={`${blocker.meaning} — earliest Guru ${formatGuruEta(blocker.earliestGuruAt, now)}`}
                className={`relative w-12 h-12 rounded-md flex items-center justify-center text-xl font-japanese transition-smooth hover:scale-105 focus-ring ${chipClasses(blocker)}`}
              >
                {blocker.character}
                {blocker.isLocked && (
                  <Lock className="absolute -top-1 -right-1 w-3.5 h-3.5 text-ink-400 dark:text-paper-300" />
                )}
              </button>
            ))}
            {result.kanjiNeeded > previewChips.length && (
              <span className="text-xs text-ink-400 dark:text-paper-300">
                +{result.kanjiNeeded - previewChips.length} more
              </span>
            )}
          </div>

          {/* Drill-down trigger */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 text-sm font-medium text-patina-500 dark:text-patina-400 hover:text-patina-600 dark:hover:text-patina-300 transition-smooth group"
          >
            View all {result.blockers.length} pending kanji
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-smooth" />
          </button>
        </>
      )}

      {subscriptionCapped && (
        <p className="mt-4 text-xs text-ink-400 dark:text-paper-300">
          Leveling past level {user.subscription.max_level_granted} requires a WaniKani
          subscription.
        </p>
      )}

      <DrilldownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pending Kanji"
        description={`Level ${user.level} kanji not yet at Guru, fastest first. The ${result.kanjiNeeded || 'highlighted'} fastest gate your level-up. Click any item for details.`}
        items={result.blockers}
        renderListItem={(blocker, onClick) => (
          <div
            onClick={onClick}
            className="flex items-center justify-between p-3 bg-paper-300/50 dark:bg-ink-300/50 rounded-lg hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer group"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="text-2xl font-japanese text-ink-100 dark:text-paper-100">
                {blocker.character}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                  {blocker.meaning}
                  {blocker.isCritical && (
                    <span className="ml-2 text-xs font-semibold text-vermillion-500 dark:text-vermillion-400">
                      gates level-up
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300 flex items-center gap-1.5 mt-0.5">
                  {blocker.isLocked ? (
                    <>
                      <Lock className="w-3 h-3" />
                      Locked — waiting on radicals
                    </>
                  ) : blocker.srsStage === 0 ? (
                    'Lesson pending'
                  ) : (
                    <SRSBadge stage={getSRSStageName(blocker.srsStage)} size="sm" />
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <div className="text-xs font-medium text-patina-500 dark:text-patina-400">
                  Guru {formatGuruEta(blocker.earliestGuruAt, now)}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  {format(blocker.earliestGuruAt, 'MMM d · p')}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100 transition-smooth" />
            </div>
          </div>
        )}
        renderDetail={(blocker) => {
          const item = enrichBlockerItem(
            blocker,
            subjects ?? [],
            reviewStats ?? [],
            assignments ?? []
          )
          if (!item) return null
          return (
            <>
              <p className="mb-4 text-sm text-ink-400 dark:text-paper-300">
                Earliest Guru:{' '}
                <span className="font-semibold text-ink-100 dark:text-paper-100">
                  {format(blocker.earliestGuruAt, 'EEE, MMM d · p')}
                </span>{' '}
                ({formatGuruEta(blocker.earliestGuruAt, now)})
              </p>
              <ItemDetailContent item={item} />
            </>
          )
        }}
      />
    </div>
  )
}
