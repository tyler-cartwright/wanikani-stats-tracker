import { useState, useMemo } from 'react'
import type { JoyoLevelData } from '@/data/jlpt'
import type { EnrichedSubject } from '@/lib/calculations/kanji-grid'
import { JOYO_KANJI } from '@/data/jlpt'
import { JLPTItemGrid } from './jlpt-item-grid'
import { cn } from '@/lib/utils/cn'
import { getMinSrsStage } from '@/lib/calculations/jlpt-readiness'

interface JLPTLevelDetailProps {
  data: JoyoLevelData
  subjects: EnrichedSubject[]
  threshold: import('@/data/jlpt').SRSThreshold
}

type FilterType = 'all' | 'known' | 'unknown'

export function JLPTLevelDetail({ data, subjects, threshold }: JLPTLevelDetailProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const minSrsStage = getMinSrsStage(threshold)

  // Create subject map for this grade's kanji
  const subjectMap = useMemo(() => {
    const map = new Map<string, EnrichedSubject | null>()
    const joyoKanji = JOYO_KANJI[data.grade] || []

    // Create lookup map
    const lookup = new Map<string, EnrichedSubject>()
    for (const subject of subjects) {
      if (subject.subjectType === 'kanji' && subject.character) {
        lookup.set(subject.character, subject)
      }
    }

    // Match kanji
    for (const kanji of joyoKanji) {
      map.set(kanji, lookup.get(kanji) || null)
    }

    return map
  }, [data.grade, subjects])

  // Get filtered items
  const items = useMemo(() => {
    const allKanji = JOYO_KANJI[data.grade] || []

    if (filter === 'all') return allKanji

    return allKanji.filter((kanji) => {
      const subject = subjectMap.get(kanji)
      if (!subject) return filter === 'unknown'

      const isKnown = subject.srsStage >= minSrsStage
      return filter === 'known' ? isKnown : !isKnown
    })
  }, [filter, data.grade, subjectMap, minSrsStage])

  // Sort items: WK items first (by SRS stage high→low), then non-WK items
  const sortedItems = useMemo(() => {
    const wkItems: Array<{ kanji: string; srsStage: number }> = []
    const nonWkItems: string[] = []

    for (const kanji of items) {
      const subject = subjectMap.get(kanji)
      if (subject) {
        wkItems.push({ kanji, srsStage: subject.srsStage })
      } else {
        nonWkItems.push(kanji)
      }
    }

    // Sort WK items by SRS stage (highest first)
    wkItems.sort((a, b) => b.srsStage - a.srsStage)

    return [...wkItems.map((item) => item.kanji), ...nonWkItems]
  }, [items, subjectMap])

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-md">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-ink-100 dark:text-paper-100">{data.label} Kanji</h3>
          <p className="text-sm text-ink-400 dark:text-paper-300 mt-1">
            {data.kanji.total} total kanji ({data.kanji.inWanikani} in WaniKani)
          </p>
        </div>

        {/* Filters */}
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
        Showing {sortedItems.length} kanji {filter !== 'all' && `(${filter})`}
      </div>

      {/* Item grid */}
      <JLPTItemGrid items={sortedItems} subjectMap={subjectMap} type="kanji" />
    </div>
  )
}
