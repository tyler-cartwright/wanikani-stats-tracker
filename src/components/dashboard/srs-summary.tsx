import { ProgressBar } from '@/components/shared/progress-bar'
import { useAssignments } from '@/lib/api/queries'
import { calculateSRSDistribution } from '@/lib/calculations/srs-distribution'
import { useSyncStore } from '@/stores/sync-store'

interface SRSStageData {
  stage: string
  count: number
  color: string
}

export function SRSSummary() {
  const { data: assignments, isLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const distribution = assignments ? calculateSRSDistribution(assignments) : null

  const srsData: SRSStageData[] = distribution
    ? [
        { stage: 'Apprentice', count: distribution.apprentice, color: 'bg-srs-apprentice' },
        { stage: 'Guru', count: distribution.guru, color: 'bg-srs-guru' },
        { stage: 'Master', count: distribution.master, color: 'bg-srs-master' },
        { stage: 'Enlightened', count: distribution.enlightened, color: 'bg-srs-enlightened' },
        { stage: 'Burned', count: distribution.burned, color: 'bg-srs-burned' },
      ]
    : []

  const maxCount = Math.max(...srsData.map((d) => d.count), 1)

  if (isLoading || isSyncing) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-8">
        SRS Distribution
      </h2>
      <div className="space-y-5">
        {srsData.map((item) => (
          <div key={item.stage} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400 dark:text-paper-300 font-medium">{item.stage}</span>
              <span className="text-ink-100 dark:text-paper-100 font-semibold tabular-nums">{item.count}</span>
            </div>
            <ProgressBar
              value={(item.count / maxCount) * 100}
              color={item.color}
              height="md"
              animated
            />
          </div>
        ))}
      </div>
    </div>
  )
}
