import type { EnrichedSubject } from '@/lib/calculations/kanji-grid'
import { cn } from '@/lib/utils/cn'

interface JLPTItemGridProps {
  items: string[]
  subjectMap: Map<string, EnrichedSubject | null>
  type: 'kanji' | 'vocabulary'
}

export function JLPTItemGrid({ items, subjectMap, type }: JLPTItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-ink-400 dark:text-paper-300">
        No {type} items for this level
      </div>
    )
  }

  // Get SRS stage color classes (matching the main kanji grid design)
  const getSRSColor = (srsStage: number) => {
    if (srsStage === 0) return 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-400'
    if (srsStage === 1) return 'bg-srs-apprentice/40 text-ink-100 dark:text-paper-100'
    if (srsStage === 2) return 'bg-srs-apprentice/60 text-ink-100 dark:text-paper-100'
    if (srsStage === 3) return 'bg-srs-apprentice/80 text-ink-100 dark:text-paper-100'
    if (srsStage === 4) return 'bg-srs-apprentice text-ink-100 dark:text-paper-100'
    if (srsStage === 5) return 'bg-srs-guru/80 text-ink-100 dark:text-paper-100'
    if (srsStage === 6) return 'bg-srs-guru text-ink-100 dark:text-paper-100'
    if (srsStage === 7) return 'bg-srs-master text-ink-100 dark:text-paper-100'
    if (srsStage === 8) return 'bg-srs-enlightened text-ink-100 dark:text-paper-100'
    if (srsStage === 9) return 'bg-srs-burned text-paper-100'
    return 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-300'
  }

  return (
    <div className={cn(
      'grid gap-2',
      type === 'kanji'
        ? 'grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16'
        : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'
    )}>
      {items.map((item) => {
        const subject = subjectMap.get(item)
        const srsStage = subject?.srsStage ?? 0
        const isInWK = subject !== null

        return (
          <div
            key={item}
            className={cn(
              'aspect-square rounded-md flex items-center justify-center font-medium transition-all',
              type === 'kanji' ? 'text-xl' : 'text-sm px-1',
              isInWK
                ? getSRSColor(srsStage)
                : 'bg-paper-300/50 dark:bg-ink-300/50 text-ink-400/50 dark:text-paper-300/50 border border-dashed border-ink-400/30 dark:border-paper-300/30'
            )}
            title={
              isInWK && subject
                ? `${subject.primaryMeaning} (${subject.srsStageName})`
                : `Not in WaniKani`
            }
          >
            <span className="truncate">{item}</span>
          </div>
        )
      })}
    </div>
  )
}
