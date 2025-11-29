import { LevelTimeline } from '@/components/progress/level-timeline'
import { Level60Projection } from '@/components/progress/level-60-projection'
import { AssignmentsTable } from '@/components/progress/assignments-table'

export function Progress() {
  return (
    <div className="space-y-8">
      {/* Level Timeline */}
      <LevelTimeline />

      {/* Level 60 Projection */}
      <Level60Projection />

      {/* Assignments Table */}
      <AssignmentsTable />
    </div>
  )
}
