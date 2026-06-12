import { useState, useMemo } from 'react'
import type { SRSThreshold } from '@/data/jlpt'
import type { EnrichedSubject } from '@/lib/calculations/kanji-grid'
import type { FrequencyBucketData } from '@/lib/calculations/frequency-coverage'
import { NEWS_FREQUENCY } from '@/data/frequency'
import { JLPTItemGrid } from './jlpt-item-grid'
import { cn } from '@/lib/utils/cn'
import { getMinSrsStage } from '@/lib/calculations/jlpt-readiness'

interface FrequencyBucketDetailProps {
  bucket: FrequencyBucketData
  subjects: EnrichedSubject[]
  threshold: SRSThreshold
}

type FilterType = 'all' | 'known' | 'unknown'

export function FrequencyBucketDetail({ bucket, subjects, threshold }: FrequencyBucketDetailProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const minSrsStage = getMinSrsStage(threshold)

  // The bucket's characters, most frequent first (rank = index + 1)
  const bucketKanji = useMemo(
    () => NEWS_FREQUENCY.kanji.slice(0, bucket.size).map(([char]) => char),
    [bucket.size]
  )

  const subjectMap = useMemo(() => {
    const lookup = new Map<string, EnrichedSubject>()
    for (const subject of subjects) {
      if (subject.subjectType === 'kanji' && subject.character) {
        lookup.set(subject.character, subject)
      }
    }

    const map = new Map<string, EnrichedSubject | null>()
    for (const kanji of bucketKanji) {
      map.set(kanji, lookup.get(kanji) || null)
    }
    return map
  }, [bucketKanji, subjects])

  const items = useMemo(() => {
    if (filter === 'all') return bucketKanji

    return bucketKanji.filter((kanji) => {
      const subject = subjectMap.get(kanji)
      if (!subject) return filter === 'unknown'

      const isKnown = subject.srsStage >= minSrsStage
      return filter === 'known' ? isKnown : !isKnown
    })
  }, [filter, bucketKanji, subjectMap, minSrsStage])

  // Keep frequency order — for this list, rank IS the story
  return (
    <div className="p-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3
            id="frequency-bucket-detail-title"
            className="text-xl font-bold text-ink-100 dark:text-paper-100"
          >
            {bucket.label} Kanji by Frequency
          </h3>
          <p className="text-sm text-ink-400 dark:text-paper-300 mt-1">
            {bucket.total} kanji, most frequent first ({bucket.inWanikani} in WaniKani) ·{' '}
            {bucket.coveragePercent.toFixed(1)}% of occurrences covered
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-smooth',
              filter === 'all'
                ? 'bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100'
                : 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-300 hover:bg-paper-300/70 dark:hover:bg-ink-300/70'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('known')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-smooth',
              filter === 'known'
                ? 'bg-patina-500 text-paper-100'
                : 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-300 hover:bg-paper-300/70 dark:hover:bg-ink-300/70'
            )}
          >
            Known
          </button>
          <button
            onClick={() => setFilter('unknown')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-smooth',
              filter === 'unknown'
                ? 'bg-vermillion-500 text-paper-100'
                : 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-300 hover:bg-paper-300/70 dark:hover:bg-ink-300/70'
            )}
          >
            Unknown
          </button>
        </div>
      </div>

      {/* Item count */}
      <div className="text-sm text-ink-400 dark:text-paper-300 mb-4">
        Showing {items.length} kanji {filter !== 'all' && `(${filter})`}
      </div>

      <JLPTItemGrid items={items} subjectMap={subjectMap} type="kanji" />
    </div>
  )
}
