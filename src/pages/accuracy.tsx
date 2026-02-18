import { AccuracyBreakdown } from '@/components/accuracy/accuracy-breakdown'
import { AccuracyDistribution } from '@/components/accuracy/accuracy-distribution'
import { TimeHeatmap } from '@/components/accuracy/time-heatmap'

export function Accuracy() {
  return (
    <div className="space-y-8">
      <AccuracyBreakdown />
      <AccuracyDistribution />
      <TimeHeatmap />
    </div>
  )
}
