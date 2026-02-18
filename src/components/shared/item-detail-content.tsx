import { SRSBadge } from '@/components/shared/srs-badge'
import { getSRSStageName } from '@/lib/api/types'
import type { LeechItem } from '@/lib/calculations/leeches'
import { ExternalLink } from 'lucide-react'

interface ItemDetailContentProps {
  item: LeechItem
}

export function ItemDetailContent({ item }: ItemDetailContentProps) {
  const hasReadings = item.type !== 'radical'

  return (
    <>
      {/* Header with character */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-japanese text-ink-100 dark:text-paper-100">
            {item.character}
          </div>
          <div className="space-y-2">
            <div className="px-3 py-1 rounded-md bg-paper-300 dark:bg-ink-300 text-sm font-medium text-ink-100 dark:text-paper-100 capitalize">
              {item.type}
            </div>
          </div>
        </div>
      </div>

      {/* Level & SRS */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-ink-400 dark:text-paper-300">
          <span className="font-medium text-ink-100 dark:text-paper-100">Level:</span>
          <span>{item.level}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-ink-400 dark:text-paper-300">SRS:</span>
          <SRSBadge stage={getSRSStageName(item.currentSRS)} size="sm" />
        </div>
      </div>

      {/* Meanings */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-3">Meanings</h4>
        <div className="flex flex-wrap gap-2">
          {item.allMeanings.map((meaning, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-sm text-ink-100 dark:text-paper-100"
            >
              {meaning}
            </div>
          ))}
        </div>
      </div>

      {/* Readings */}
      {hasReadings && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-3">Readings</h4>

          {item.type === 'kanji' && (
            <div className="space-y-3">
              {/* On'yomi */}
              {item.readings.onyomi.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-ink-400 dark:text-paper-300 mb-2">
                    On'yomi
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.readings.onyomi.map((reading, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-sm font-japanese text-ink-100 dark:text-paper-100"
                      >
                        {reading}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kun'yomi */}
              {item.readings.kunyomi.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-ink-400 dark:text-paper-300 mb-2">
                    Kun'yomi
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.readings.kunyomi.map((reading, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-sm font-japanese text-ink-100 dark:text-paper-100"
                      >
                        {reading}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.readings.onyomi.length === 0 && item.readings.kunyomi.length === 0 && (
                <div className="text-sm text-ink-400 dark:text-paper-300">No readings available</div>
              )}
            </div>
          )}

          {item.type === 'vocabulary' && (
            <div className="flex flex-wrap gap-2">
              {item.readings.vocabulary.length > 0 ? (
                item.readings.vocabulary.map((reading, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-sm font-japanese text-ink-100 dark:text-paper-100"
                  >
                    {reading}
                  </div>
                ))
              ) : (
                <div className="text-sm text-ink-400 dark:text-paper-300">No readings available</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Accuracy Stats */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-3">Accuracy</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-paper-300/50 dark:bg-ink-300/50">
            <div className="text-2xl font-semibold text-vermillion-500 dark:text-vermillion-400">
              {item.accuracy.toFixed(2)}%
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">Overall</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-paper-300/50 dark:bg-ink-300/50">
            <div className="text-2xl font-semibold text-ink-100 dark:text-paper-100">
              {item.meaningAccuracy.toFixed(2)}%
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">Meaning</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-paper-300/50 dark:bg-ink-300/50">
            <div className="text-2xl font-semibold text-ink-100 dark:text-paper-100">
              {item.readingAccuracy.toFixed(2)}%
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">Reading</div>
          </div>
        </div>
      </div>

      {/* WaniKani Link */}
      <a
        href={item.documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-md bg-paper-300 dark:bg-ink-300 hover:bg-paper-400 dark:hover:bg-ink-400 text-ink-100 dark:text-paper-100 transition-smooth focus-ring"
      >
        View on WaniKani
        <ExternalLink className="w-4 h-4" />
      </a>
    </>
  )
}
