import { Lightbulb } from 'lucide-react'
import { useReviewStatistics, useSubjects } from '@/lib/api/queries'
import { calculateAccuracyMetrics } from '@/lib/calculations/accuracy'
import { useSyncStore } from '@/stores/sync-store'
import { ProgressBar } from '@/components/shared/progress-bar'
import { cn } from '@/lib/utils/cn'

function accuracyTextColor(value: number) {
  if (value >= 90) return 'text-patina-500 dark:text-patina-400'
  if (value >= 80) return 'text-ink-100 dark:text-paper-100'
  return 'text-vermillion-500 dark:text-vermillion-400'
}

function accuracyBarColor(value: number) {
  if (value >= 90) return 'bg-patina-500'
  if (value >= 80) return 'bg-ink-400'
  return 'bg-vermillion-500'
}

interface PillarProps {
  label: string
  accuracy: number
  correct: number
  incorrect: number
  total: number
}

function Pillar({ label, accuracy, correct, incorrect, total }: PillarProps) {
  return (
    <div className="bg-paper-300/40 dark:bg-ink-300/40 rounded-lg p-4 flex flex-col gap-3">
      {/* Label */}
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-paper-300">
        {label}
      </div>

      {/* Hero accuracy */}
      <div className={cn('text-3xl font-display font-semibold tabular-nums leading-none', accuracyTextColor(accuracy))}>
        {accuracy.toFixed(2)}%
      </div>

      {/* Progress bar */}
      <ProgressBar value={accuracy} color={accuracyBarColor(accuracy)} height="md" animated />

      {/* Counts */}
      <div className="pt-1 space-y-1.5 border-t border-paper-300/60 dark:border-ink-300/60">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400 dark:text-paper-300">Correct</span>
          <span className="font-medium tabular-nums text-patina-500 dark:text-patina-400">
            {correct.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400 dark:text-paper-300">Incorrect</span>
          <span className="font-medium tabular-nums text-vermillion-500 dark:text-vermillion-400">
            {incorrect.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400 dark:text-paper-300">Reviews</span>
          <span className="font-medium tabular-nums text-ink-100 dark:text-paper-100">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AccuracyBreakdown() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const isLoading = statsLoading || subjectsLoading || isSyncing

  const metrics =
    reviewStats && subjects ? calculateAccuracyMetrics(reviewStats, subjects) : null

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 w-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-paper-300/40 dark:bg-ink-300/40 rounded-lg p-4 space-y-3">
              <div className="h-3 w-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-9 w-28 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
              <div className="pt-2 space-y-2">
                <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-4 border-t border-paper-300 dark:border-ink-300">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const { counts, byType, overall, meaning, reading } = metrics
  const accuracyDiff = meaning - reading
  const showInsight = Math.abs(accuracyDiff) >= 5

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
        Accuracy
      </h2>

      {/* Three pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Pillar
          label="Reading"
          accuracy={reading}
          correct={counts.reading.correct}
          incorrect={counts.reading.incorrect}
          total={counts.reading.total}
        />
        <Pillar
          label="Meaning"
          accuracy={meaning}
          correct={counts.meaning.correct}
          incorrect={counts.meaning.incorrect}
          total={counts.meaning.total}
        />
        <Pillar
          label="Total"
          accuracy={overall}
          correct={counts.total.correct}
          incorrect={counts.total.incorrect}
          total={counts.total.total}
        />
      </div>

      {/* Type breakdown */}
      <div className="pt-4 border-t border-paper-300 dark:border-ink-300">
        {/* Column headers */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div />
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-paper-300 text-right">
            Reading
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-paper-300 text-right">
            Meaning
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-paper-300 text-right">
            Total
          </div>
        </div>

        {/* Radicals */}
        <div className="grid grid-cols-4 gap-2 py-2 border-t border-paper-300/50 dark:border-ink-300/50">
          <div className="text-sm font-medium text-ink-100 dark:text-paper-100">Radicals</div>
          <div className="text-sm text-ink-400 dark:text-paper-400 text-right">—</div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.radicals.meaning))}>
            {byType.radicals.meaning.toFixed(2)}%
          </div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.radicals.overall))}>
            {byType.radicals.overall.toFixed(2)}%
          </div>
        </div>

        {/* Kanji */}
        <div className="grid grid-cols-4 gap-2 py-2 border-t border-paper-300/50 dark:border-ink-300/50">
          <div className="text-sm font-medium text-ink-100 dark:text-paper-100">Kanji</div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.kanji.reading))}>
            {byType.kanji.reading.toFixed(2)}%
          </div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.kanji.meaning))}>
            {byType.kanji.meaning.toFixed(2)}%
          </div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.kanji.overall))}>
            {byType.kanji.overall.toFixed(2)}%
          </div>
        </div>

        {/* Vocabulary */}
        <div className="grid grid-cols-4 gap-2 py-2 border-t border-paper-300/50 dark:border-ink-300/50">
          <div className="text-sm font-medium text-ink-100 dark:text-paper-100">Vocabulary</div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.vocabulary.reading))}>
            {byType.vocabulary.reading.toFixed(2)}%
          </div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.vocabulary.meaning))}>
            {byType.vocabulary.meaning.toFixed(2)}%
          </div>
          <div className={cn('text-sm text-right tabular-nums font-medium', accuracyTextColor(byType.vocabulary.overall))}>
            {byType.vocabulary.overall.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Insight */}
      {showInsight && (
        <div className="mt-4 p-4 bg-vermillion-500/10 dark:bg-vermillion-500/20 border border-vermillion-500/20 dark:border-vermillion-500/30 rounded-lg">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-vermillion-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-ink-100 dark:text-paper-100">
              {accuracyDiff > 0 ? (
                <>
                  Your reading accuracy is {Math.abs(accuracyDiff).toFixed(2)}% lower than meaning.
                  Consider focusing on reading practice.
                </>
              ) : (
                <>
                  Your meaning accuracy is {Math.abs(accuracyDiff).toFixed(2)}% lower than reading.
                  Consider focusing on meaning practice.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
