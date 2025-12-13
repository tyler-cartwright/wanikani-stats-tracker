import { LevelTimeline } from '@/components/progress/level-timeline'
import { Level60Projection } from '@/components/progress/level-60-projection'

export function Progress() {
  return (
    <div className="space-y-8">
      {/* Level 60 Projection */}
      <Level60Projection />

      {/* Level Timeline */}
      <LevelTimeline />
    </div>
  )
}
