import { AccuracyOverview } from '@/components/accuracy/accuracy-overview'
import { TypeBreakdown } from '@/components/accuracy/type-breakdown'
import { TimeHeatmap } from '@/components/accuracy/time-heatmap'

export function Accuracy() {
  return (
    <div className="space-y-8">
      {/* Overview */}
      <AccuracyOverview />

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TypeBreakdown />
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
            Meaning vs Reading
          </h2>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-patina-500 dark:text-patina-400 mb-2">
                91%
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300">Meaning Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-semibold text-vermillion-500 dark:text-vermillion-400 mb-2">
                83%
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300">Reading Accuracy</div>
            </div>
            <div className="pt-4 border-t border-paper-300 dark:border-ink-300 text-sm text-ink-400 dark:text-paper-300 text-center">
              8% difference suggests reading practice needed
            </div>
          </div>
        </div>
      </div>

      {/* Time Heatmap */}
      <TimeHeatmap />
    </div>
  )
}
