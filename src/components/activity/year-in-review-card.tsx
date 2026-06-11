import { useMemo, useState } from 'react'
import { Share2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ActivityDayRow } from '@/lib/db/schema'
import { useAssignments, useLevelProgressions, useSubjects, useUser } from '@/lib/api/queries'
import { calculateMilestones } from '@/lib/calculations/milestones'
import { filterToYear, listAvailableYears, summarizeActivity } from '@/lib/calculations/activity-summary'
import { buildYearInReviewCardData } from '@/lib/share-cards/data-prep'
import type { ShareCardData } from '@/lib/share-cards/types'
import { ShareCardModal } from '@/components/share/share-card-modal'

export function YearInReviewCard({ history }: { history: ActivityDayRow[] }) {
  const { data: user } = useUser()
  const { data: assignments } = useAssignments()
  const { data: levelProgressions } = useLevelProgressions()
  const { data: subjects } = useSubjects()

  const years = useMemo(() => listAvailableYears(history), [history])
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear())
  const [cardData, setCardData] = useState<ShareCardData | null>(null)

  const yearSummary = useMemo(
    () => summarizeActivity(filterToYear(history, selectedYear)),
    [history, selectedYear]
  )

  if (years.length === 0) return null

  const handleCreate = () => {
    if (!user) return
    const achieved =
      assignments && levelProgressions && subjects
        ? calculateMilestones(assignments, levelProgressions, subjects, user.level).achieved
        : []
    setCardData(buildYearInReviewCardData(user.username, selectedYear, history, achieved))
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Year in Review
        </h2>
        {years.length > 1 && (
          <div className="flex gap-1 bg-paper-300 dark:bg-ink-300 rounded-lg p-1">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-smooth',
                  year === selectedYear
                    ? 'bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 font-medium shadow-sm'
                    : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
                )}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-ink-400 dark:text-paper-300 mb-4">
        {yearSummary.totalReviews.toLocaleString()} reviews ·{' '}
        {yearSummary.totalLessons.toLocaleString()} lessons ·{' '}
        {yearSummary.activeDays.toLocaleString()} active days in {selectedYear} — turn it
        into a shareable image.
      </p>

      <button
        onClick={handleCreate}
        disabled={!user}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share2 className="w-4 h-4" />
        Create share card
      </button>

      <ShareCardModal
        isOpen={cardData !== null}
        onClose={() => setCardData(null)}
        data={cardData}
        title={`${selectedYear} in Review`}
      />
    </div>
  )
}
