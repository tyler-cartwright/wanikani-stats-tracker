import { format } from 'date-fns'
import { RotateCcw } from 'lucide-react'
import { useLevelProgressions } from '@/lib/api/queries'
import { detectResets } from '@/lib/calculations/reset-detection'

export function ResetHistoryNotice() {
  const { data: levelProgressions } = useLevelProgressions()

  if (!levelProgressions) return null

  const resets = detectResets(levelProgressions)
  if (resets.length === 0) return null

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <RotateCcw className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-sm">Reset History</span>
      </div>
      <ul className="space-y-1 text-sm text-ink-600 dark:text-paper-400 mb-2">
        {resets.map((r) => (
          <li key={r.resetDate}>
            Level {r.originalLevel} → Level {r.targetLevel} on{' '}
            {format(new Date(r.resetDate), 'MMM d, yyyy')}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-500 dark:text-paper-500">
        Pre-reset progression data is excluded from calculations on this page.
      </p>
    </div>
  )
}
