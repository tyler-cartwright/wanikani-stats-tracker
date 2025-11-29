import { AccuracyOverview } from '@/components/accuracy/accuracy-overview'
import { TypeBreakdown } from '@/components/accuracy/type-breakdown'
import { AccuracyDistribution } from '@/components/accuracy/accuracy-distribution'
import { TimeHeatmap } from '@/components/accuracy/time-heatmap'

export function Accuracy() {
  return (
    <div className="space-y-8">
      {/* Overview */}
      <AccuracyOverview />

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TypeBreakdown />
        <AccuracyDistribution />
      </div>

      {/* Time Heatmap */}
      <TimeHeatmap />
    </div>
  )
}
