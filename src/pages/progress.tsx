import { LevelTimeline } from '@/components/progress/level-timeline'
import { Level60Projection } from '@/components/progress/level-60-projection'
import { BurnVelocity } from '@/components/progress/burn-velocity'
import { KnowledgeStability } from '@/components/progress/knowledge-stability'
import { MilestoneTimeline } from '@/components/progress/milestone-timeline'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function Progress() {
  useDocumentTitle('Progress')
  return (
    <div className="space-y-8">
      {/* Level 60 Projection */}
      <Level60Projection />

      {/* Knowledge Stability */}
      <KnowledgeStability />

      {/* Burn Velocity */}
      <BurnVelocity />

      {/* Milestone Timeline */}
      <MilestoneTimeline />

      {/* Level Timeline */}
      <LevelTimeline />
    </div>
  )
}
