import { HeroStats } from '@/components/dashboard/hero-stats'
import { SRSSummary } from '@/components/dashboard/srs-summary'
import { LevelProgress } from '@/components/dashboard/level-progress'
import { ReviewForecast } from '@/components/dashboard/review-forecast'

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

        {/* Leech Alert - warm paper, vermillion accents */}
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
            Leech Alert
          </h2>
          <p className="text-sm text-ink-400 dark:text-paper-300 mb-6 leading-relaxed">
            You have <span className="text-vermillion-500 font-semibold">24 leeches</span> that need attention.
          </p>
          <a
            href="/leeches"
            className="inline-block text-sm font-medium text-vermillion-500 hover:text-vermillion-600 transition-smooth"
          >
            View problem items →
          </a>
        </div>
      </div>
    </div>
  )
}
