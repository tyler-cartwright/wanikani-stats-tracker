import { formatDistanceToNow } from 'date-fns'
import { JapaneseLabel } from '@/components/shared/japanese-label'
import { useUser, useSummary, useAssignments } from '@/lib/api/queries'
import {
  countLessonsAvailable,
  countReviewsAvailable,
  getNextReviewAt,
} from '@/lib/calculations/summary-fallback'
import { useSyncStore } from '@/stores/sync-store'

export function HeroStats() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: summary, isLoading: summaryLoading } = useSummary()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = userLoading || summaryLoading || assignmentsLoading || isSyncing

  // Calculate current reviews from assignments (accurate)
  const reviewsAvailable = countReviewsAvailable(assignments ?? [], new Date())

  // Lessons and next review come from /summary when reachable (it owns the
  // gating rules); offline they're derived from local assignments.
  const lessonsAvailable = summary
    ? summary.lessons.reduce((sum, l) => sum + l.subject_ids.length, 0)
    : countLessonsAvailable(assignments ?? [])

  const nextReviewsAt = summary
    ? summary.next_reviews_at
    : getNextReviewAt(assignments ?? [], new Date())

  const nextReviewTime = nextReviewsAt
    ? formatDistanceToNow(new Date(nextReviewsAt), { addSuffix: true })
    : null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-3">
            <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-20 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16">
      {/* Level - Crimson Pro, Vermillion red */}
      <div className="text-center md:text-left space-y-3">
        <div className="text-3xl font-display font-semibold text-vermillion-500 leading-tight">
          Level {user?.level ?? 1}
        </div>
        <div>
          <div className="text-sm font-medium text-ink-400 dark:text-paper-300">Level</div>
          <JapaneseLabel text="段階" />
        </div>
      </div>

      {/* Reviews - Larger numbers, display font */}
      <div className="text-center space-y-3">
        <div className="text-3xl font-display font-semibold text-ink-100 dark:text-paper-100 leading-tight">
          {reviewsAvailable}
        </div>
        <div>
          <div className="text-sm font-medium text-ink-400 dark:text-paper-300">Reviews</div>
          <JapaneseLabel text="復習" />
        </div>
        {nextReviewTime && reviewsAvailable === 0 && (
          <div className="text-xs text-ink-500 dark:text-paper-400 mt-3">
            Next review {nextReviewTime}
          </div>
        )}
      </div>

      {/* Lessons - Larger numbers, display font */}
      <div className="text-center md:text-right space-y-3">
        <div className="text-3xl font-display font-semibold text-ink-100 dark:text-paper-100 leading-tight">
          {lessonsAvailable}
        </div>
        <div>
          <div className="text-sm font-medium text-ink-400 dark:text-paper-300">Lessons</div>
          <JapaneseLabel text="学習" />
        </div>
      </div>
    </div>
  )
}
