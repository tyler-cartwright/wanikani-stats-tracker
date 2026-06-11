import { CalendarDays } from 'lucide-react'

export function ActivityEmptyState() {
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-14 h-14 rounded-full bg-patina-500/10 dark:bg-patina-400/10 flex items-center justify-center mb-4">
          <CalendarDays className="w-7 h-7 text-patina-500 dark:text-patina-400" />
        </div>
        <div className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
          No Activity Captured Yet
        </div>
        <div className="text-sm text-ink-400 dark:text-paper-300 max-w-md">
          WaniTrack records your daily reviews and lessons as you sync. WaniKani
          no longer provides historical review data, so your history accumulates
          forward from your first sync — do some reviews, come back tomorrow,
          and your heatmap will start to fill in.
        </div>
      </div>
    </div>
  )
}
