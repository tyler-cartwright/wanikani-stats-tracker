import { AccuracyBreakdown } from '@/components/accuracy/accuracy-breakdown'
import { AccuracyDistribution } from '@/components/accuracy/accuracy-distribution'
import { TimeHeatmap } from '@/components/accuracy/time-heatmap'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function Accuracy() {
  useDocumentTitle('Accuracy')
  return (
    <div className="space-y-8">
      <AccuracyBreakdown />
      <AccuracyDistribution />
      <TimeHeatmap />
    </div>
  )
}
