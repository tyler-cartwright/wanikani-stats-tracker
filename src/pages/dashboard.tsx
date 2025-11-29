import { HeroStats } from '@/components/dashboard/hero-stats'
import { SRSSummary } from '@/components/dashboard/srs-summary'
import { LevelProgress } from '@/components/dashboard/level-progress'
import { ReviewForecast } from '@/components/dashboard/review-forecast'
import { LeechAlert } from '@/components/dashboard/leech-alert'

export function Dashboard() {
  return (
    <div className="space-y-10">
      {/* Hero Stats - generous spacing */}
      <HeroStats />

      {/* Two Column Grid - more breathing room */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LevelProgress />
        <SRSSummary />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ReviewForecast />
        <LeechAlert />
      </div>
    </div>
  )
}
