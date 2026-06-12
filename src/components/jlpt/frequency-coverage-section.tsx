import { useState } from 'react'
import { Newspaper, ChevronRight } from 'lucide-react'
import type { SRSThreshold } from '@/data/jlpt'
import type { EnrichedSubject } from '@/lib/calculations/kanji-grid'
import type {
  FrequencyBucketData,
  FrequencyCoverageResult,
} from '@/lib/calculations/frequency-coverage'
import { FREQ_CORPUS, FREQ_DATA_LICENSE } from '@/data/frequency'
import { Modal, ModalClose } from '@/components/shared/modal'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import { FrequencyBucketDetail } from './frequency-bucket-detail'

interface FrequencyCoverageSectionProps {
  coverage: FrequencyCoverageResult
  subjects: EnrichedSubject[]
  threshold: SRSThreshold
}

export function FrequencyCoverageSection({
  coverage,
  subjects,
  threshold,
}: FrequencyCoverageSectionProps) {
  const [selectedBucket, setSelectedBucket] = useState<FrequencyBucketData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openBucket = (bucket: FrequencyBucketData) => {
    setSelectedBucket(bucket)
    setIsModalOpen(true)
  }

  // The cap only deserves a mention once it meaningfully limits the score
  const showCeiling = coverage.maxPossiblePercent < 99.5

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-ochre-500" />
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
            Text Coverage
          </h2>
          <InfoTooltip content="How much of real Japanese text you can read, weighted by how often each kanji actually appears. Knowing the 100 most frequent kanji covers far more text than 100 rare ones." />
        </div>
        <span className="text-xs text-ink-400 dark:text-paper-300">
          {FREQ_CORPUS} corpus · {FREQ_DATA_LICENSE}
        </span>
      </div>

      {/* Headline */}
      <div className="mb-2">
        <span className="text-4xl md:text-5xl font-display font-bold text-ink-100 dark:text-paper-100">
          {coverage.coveragePercent.toFixed(1)}%
        </span>
        <span className="ml-3 text-sm text-ink-400 dark:text-paper-300">
          of kanji occurrences in typical news text are kanji you know
        </span>
      </div>
      {showCeiling && (
        <p className="text-xs text-ink-400 dark:text-paper-300 mb-6">
          Max {coverage.maxPossiblePercent.toFixed(1)}% via WaniKani — the remaining kanji on the
          frequency list aren't taught there.
        </p>
      )}
      {!showCeiling && <div className="mb-6" />}

      {/* Rank buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {coverage.buckets.map((bucket) => (
          <button
            key={bucket.label}
            onClick={() => openBucket(bucket)}
            className="text-left bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-4 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-400 dark:text-paper-300">
                {bucket.label}
              </span>
              <ChevronRight className="w-4 h-4 text-ink-400 dark:text-paper-300 group-hover:text-ink-100 dark:group-hover:text-paper-100 transition-smooth" />
            </div>
            <div className="text-lg font-semibold text-ink-100 dark:text-paper-100 mb-2 tabular-nums">
              {bucket.known}/{bucket.total}
              <span className="ml-2 text-xs font-normal text-ink-400 dark:text-paper-300">
                known
              </span>
            </div>
            <div className="h-1.5 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-ochre-500 rounded-full transition-all duration-slow ease-out"
                style={{ width: `${Math.min(bucket.coveragePercent, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-ink-400 dark:text-paper-300 tabular-nums">
              {bucket.coveragePercent.toFixed(1)}% of occurrences
            </div>
          </button>
        ))}
      </div>

      {/* Bucket Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        labelledBy="frequency-bucket-detail-title"
      >
        <ModalClose onClose={() => setIsModalOpen(false)} />
        {selectedBucket && (
          <FrequencyBucketDetail
            bucket={selectedBucket}
            subjects={subjects}
            threshold={threshold}
          />
        )}
      </Modal>
    </div>
  )
}
