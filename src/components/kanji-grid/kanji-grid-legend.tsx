import type { SRSStage } from '@/lib/api/types'
import { cn } from '@/lib/utils/cn'

interface KanjiGridLegendProps {
  distribution: Record<SRSStage, number>
}

const stageInfo: Record<SRSStage, { label: string; colorClass: string }> = {
  initiate: { label: 'Locked', colorClass: 'bg-paper-300 dark:bg-ink-300' },
  apprentice: { label: 'Apprentice', colorClass: 'bg-srs-apprentice' },
  guru: { label: 'Guru', colorClass: 'bg-srs-guru' },
  master: { label: 'Master', colorClass: 'bg-srs-master' },
  enlightened: { label: 'Enlightened', colorClass: 'bg-srs-enlightened' },
  burned: { label: 'Burned', colorClass: 'bg-srs-burned' },
}

const subjectTypes = [
  { label: 'Radical', colorClass: 'border-t-[#00AAFF]' },
  { label: 'Kanji', colorClass: 'border-t-[#FF00AA]' },
  { label: 'Vocabulary', colorClass: 'border-t-[#AA00FF]' },
]

export function KanjiGridLegend({ distribution }: KanjiGridLegendProps) {
  const stages: SRSStage[] = ['initiate', 'apprentice', 'guru', 'master', 'enlightened', 'burned']

  return (
    <div className="space-y-3">
      {/* Subject Type Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-ink-300 dark:text-paper-300 font-medium">Item Types:</span>
        {subjectTypes.map((type) => (
          <div key={type.label} className="flex items-center gap-2">
            <div className={cn('w-4 h-4 rounded bg-paper-200 dark:bg-ink-200 border-t-2', type.colorClass)} />
            <span className="text-ink-200 dark:text-paper-200">{type.label}</span>
          </div>
        ))}
      </div>

      {/* SRS Stage Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-ink-300 dark:text-paper-300 font-medium">SRS Stages:</span>
        {stages.map((stage) => {
          const info = stageInfo[stage]
          const count = distribution[stage] ?? 0

          return (
            <div key={stage} className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded', info.colorClass)} />
              <span className="text-ink-200 dark:text-paper-200">
                {info.label} <span className="text-ink-300 dark:text-paper-300">({count})</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
