import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Flame, Star, Trophy, Award, Sparkles, Grid3x3, List } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAssignments, useLevelProgressions, useSubjects, useUser } from '@/lib/api/queries'
import { useSyncStore } from '@/stores/sync-store'
import { calculateMilestones, type Milestone } from '@/lib/calculations/milestones'

interface MilestoneBadgeProps {
  milestone: Milestone
  isAchieved: boolean
}

function MilestoneBadge({ milestone, isAchieved }: MilestoneBadgeProps) {
  const Icon = getIcon(milestone.icon)
  const progress = milestone.target > 0 ? (milestone.current / milestone.target) * 100 : 0

  return (
    <div
      className={cn(
        'flex flex-col items-center p-3 rounded-lg transition-smooth group relative',
        isAchieved
          ? 'bg-paper-300/50 dark:bg-ink-300/50 hover:bg-paper-300 dark:hover:bg-ink-300'
          : 'bg-paper-300/20 dark:bg-ink-300/20 opacity-60'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-smooth',
          isAchieved
            ? 'bg-vermillion-500/20 dark:bg-vermillion-400/20'
            : 'bg-paper-300 dark:bg-ink-300'
        )}
      >
        <Icon
          className={cn(
            'w-6 h-6 transition-smooth',
            isAchieved
              ? 'text-vermillion-500 dark:text-vermillion-400'
              : 'text-ink-400 dark:text-paper-400'
          )}
        />
      </div>

      {/* Label */}
      <div
        className={cn(
          'text-xs font-medium text-center',
          isAchieved
            ? 'text-ink-100 dark:text-paper-100'
            : 'text-ink-400 dark:text-paper-300'
        )}
      >
        {milestone.label}
      </div>

      {/* Progress for upcoming milestones */}
      {!isAchieved && progress > 0 && (
        <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
          {Math.round(progress)}%
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs px-3 py-2 rounded whitespace-nowrap shadow-lg">
          {milestone.description}
          {isAchieved && milestone.achievedAt && (
            <div className="text-ink-400 dark:text-paper-300 mt-1">
              {format(milestone.achievedAt, 'MMM d, yyyy')}
            </div>
          )}
          {!isAchieved && (
            <div className="text-ink-400 dark:text-paper-300 mt-1">
              {milestone.current.toLocaleString()} / {milestone.target.toLocaleString()}
            </div>
          )}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-ink-100 dark:border-t-paper-100" />
        </div>
      </div>
    </div>
  )
}

function MilestoneTimelineItem({ milestone }: { milestone: Milestone }) {
  const Icon = getIcon(milestone.icon)

  return (
    <div className="flex items-start gap-4 p-4 bg-paper-300/50 dark:bg-ink-300/50 rounded-lg">
      <div className="w-10 h-10 rounded-full bg-vermillion-500/20 dark:bg-vermillion-400/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-vermillion-500 dark:text-vermillion-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ink-100 dark:text-paper-100">{milestone.label}</div>
        <div className="text-sm text-ink-400 dark:text-paper-300 mt-0.5">
          {milestone.description}
        </div>
      </div>
      {milestone.achievedAt && (
        <div className="text-xs text-ink-400 dark:text-paper-300 flex-shrink-0">
          {format(milestone.achievedAt, 'MMM d, yyyy')}
        </div>
      )}
    </div>
  )
}

function NextMilestonePreview({ milestone }: { milestone: Milestone }) {
  const Icon = getIcon(milestone.icon)
  const progress = milestone.target > 0 ? (milestone.current / milestone.target) * 100 : 0
  const remaining = milestone.target - milestone.current

  return (
    <div className="flex items-center gap-4 p-4 bg-paper-300/50 dark:bg-ink-300/50 rounded-lg mt-2">
      <div className="w-10 h-10 rounded-full bg-vermillion-500/10 dark:bg-vermillion-400/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-vermillion-500 dark:text-vermillion-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ink-100 dark:text-paper-100 mb-2">
          {milestone.label}
        </div>
        {/* Progress bar */}
        <div className="relative h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-vermillion-500 dark:bg-vermillion-400 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
          {remaining.toLocaleString()} more to go
        </div>
      </div>
    </div>
  )
}

function getIcon(iconName: string) {
  const icons: Record<string, typeof Flame> = {
    Flame,
    Star,
    Trophy,
    Award,
    Sparkles,
  }
  return icons[iconName] || Trophy
}

export function MilestoneTimeline() {
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: levelProgressions, isLoading: progressionsLoading } = useLevelProgressions()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: user, isLoading: userLoading } = useUser()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')

  const isLoading = assignmentsLoading || progressionsLoading || subjectsLoading || userLoading || isSyncing

  const milestones = useMemo(() => {
    if (!assignments || !levelProgressions || !subjects || !user) return null
    return calculateMilestones(assignments, levelProgressions, subjects, user.level)
  }, [assignments, levelProgressions, subjects, user])

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-8 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-20" />
        </div>

        {/* Stats summary */}
        <div className="flex gap-4 mb-6">
          <div className="h-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-20" />
          <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-40 self-center" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-square bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!milestones) {
    return null
  }

  // Combine all milestones for grid view, sort by achievement and then by target
  const allMilestones = [...milestones.achieved, ...milestones.upcoming].sort((a, b) => {
    // Sort by type first (burn, srs, level)
    if (a.type !== b.type) {
      const typeOrder = { burn: 0, srs: 1, level: 2 }
      return typeOrder[a.type] - typeOrder[b.type]
    }
    // Then by target
    return a.target - b.target
  })

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Achievements
        </h2>
        <div className="flex gap-1 bg-paper-300 dark:bg-ink-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-smooth',
              viewMode === 'grid'
                ? 'bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 shadow-sm'
                : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
            )}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              'p-2 rounded-md transition-smooth',
              viewMode === 'timeline'
                ? 'bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 shadow-sm'
                : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
            )}
            aria-label="Timeline view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex gap-4 mb-6">
        <div className="text-3xl font-display font-bold text-ink-100 dark:text-paper-100">
          {milestones.stats.totalAchieved}
        </div>
        <div className="text-sm text-ink-400 dark:text-paper-300 self-center">
          milestones achieved
        </div>
      </div>

      {/* Grid view: Achievement badges */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {allMilestones.map((milestone) => (
            <MilestoneBadge
              key={milestone.id}
              milestone={milestone}
              isAchieved={milestone.isAchieved}
            />
          ))}
        </div>
      )}

      {/* Timeline view: Chronological list */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {milestones.achieved.length > 0 ? (
            milestones.achieved.map((milestone) => (
              <MilestoneTimelineItem key={milestone.id} milestone={milestone} />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-ink-400 dark:text-paper-300">
              No milestones achieved yet. Keep learning!
            </div>
          )}
        </div>
      )}

      {/* Next milestone teaser */}
      {milestones.stats.nextMilestone && (
        <div className="mt-6 border-t border-paper-300 dark:border-ink-300 pt-4">
          <div className="text-sm text-ink-400 dark:text-paper-300 mb-2">Next milestone:</div>
          <NextMilestonePreview milestone={milestones.stats.nextMilestone} />
        </div>
      )}
    </div>
  )
}
