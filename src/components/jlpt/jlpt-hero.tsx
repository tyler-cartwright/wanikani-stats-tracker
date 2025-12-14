import type { JoyoReadinessResult } from '@/data/jlpt'
import { JOYO_GRADE_INFO, SRS_THRESHOLD_LABELS } from '@/data/jlpt'
import { JLPTProgressRing } from './jlpt-progress-ring'
import { JLPTThresholdSelect } from './jlpt-threshold-select'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import { BookOpen, Award } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'

interface JLPTHeroProps {
  readiness: JoyoReadinessResult
}

export function JLPTHero({ readiness }: JLPTHeroProps) {
  const {
    currentGrade,
    totalKanjiKnown,
    totalKanjiInWanikani,
    frequencyCoverage,
    approximateJlpt,
  } = readiness

  const jlptThreshold = useSettingsStore((state) => state.jlptThreshold)

  // Calculate overall percentage
  const overallPercentage =
    totalKanjiInWanikani > 0 ? Math.round((totalKanjiKnown / totalKanjiInWanikani) * 100) : 0

  // Get current grade info
  const gradeLabel = currentGrade ? JOYO_GRADE_INFO[currentGrade].label : null

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      {/* Header with threshold selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold text-ink-100 dark:text-paper-100">
          Exam Readiness
        </h1>
        <JLPTThresholdSelect />
      </div>

      {/* Hero - Centered Progress Display */}
      <div className="mb-10">
        <div className="flex flex-col items-center text-center py-6">
          {/* Small label */}
          <div className="text-xs uppercase tracking-wider text-ink-400 dark:text-paper-300 mb-3">
            Current Progress
          </div>

          {currentGrade ? (
            <>
              {/* Large grade display */}
              <div className="text-4xl md:text-5xl font-display font-bold text-ink-100 dark:text-paper-100 mb-2">
                {gradeLabel}
              </div>
              <div className="text-lg text-ink-400 dark:text-paper-300 mb-4">
                Complete
              </div>
            </>
          ) : (
            <>
              {/* Early progress message */}
              <div className="text-2xl md:text-3xl font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
                Getting Started
              </div>
              <div className="text-sm text-ink-400 dark:text-paper-300 mb-4">
                Keep studying to complete Grade 1
              </div>
            </>
          )}

          {/* Secondary stats with dot separators */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-ink-400 dark:text-paper-300">
            <span>{totalKanjiKnown} kanji</span>
            <span className="w-1 h-1 rounded-full bg-vermillion-500" />
            <span>{frequencyCoverage}% coverage</span>
            <span className="w-1 h-1 rounded-full bg-vermillion-500" />
            <span>{approximateJlpt || '—'} level</span>
          </div>

          {/* Subtle divider with vermillion accent */}
          <div className="mt-6 w-48 h-px bg-gradient-to-r from-transparent via-vermillion-500/40 to-transparent" />
        </div>

        {/* Threshold indicator badge */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-ink-400 dark:text-paper-300 bg-paper-300/50 dark:bg-ink-300/50 px-3 py-1 rounded-full">
            <span>{SRS_THRESHOLD_LABELS[jlptThreshold]} threshold</span>
            <span className="w-1 h-1 rounded-full bg-ink-400/40 dark:bg-paper-300/40" aria-hidden="true" />
            <span>{totalKanjiInWanikani}/2,136 Jōyō in WaniKani</span>
          </div>
        </div>
      </div>

      {/* Three Key Metrics - Refined */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Kanji Progress Ring */}
        <div className="flex flex-col items-center">
          <JLPTProgressRing
            percentage={overallPercentage}
            label="Jōyō Kanji"
            count={`${totalKanjiKnown}/${totalKanjiInWanikani}`}
            size={120}
            strokeWidth={10}
          />
          <p className="text-xs text-ink-400 dark:text-paper-300 mt-3 text-center">
            Overall Jōyō progress
          </p>
        </div>

        {/* Reading Coverage */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
              Reading Coverage
            </div>
            <InfoTooltip content="Based on kanji frequency in newspapers. This estimates what percentage of kanji you'll encounter in real text. Note: Jōyō kanji are organized by grade level, not strict frequency, so actual coverage may vary." />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-ochre-500" />
            <div className="text-3xl font-bold text-ink-100 dark:text-paper-100">{frequencyCoverage}%</div>
          </div>
          <p className="text-xs text-ink-400 dark:text-paper-300 text-center max-w-[200px]">
            Estimated text coverage
          </p>
        </div>

        {/* JLPT Approximation */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-semibold text-ink-100 dark:text-paper-100">
              Approximate JLPT
            </div>
            <InfoTooltip content="Rough mapping based on grade completion: Grade 1 → N5, Grades 1-2 → N4, Grades 1-4 → N3, Grades 1-6 → N2, All Jōyō → N1. JLPT tests vocabulary, grammar, and reading comprehension beyond just kanji." />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-vermillion-500" />
            <div className="text-3xl font-bold text-ink-100 dark:text-paper-100">
              {approximateJlpt || '—'}
            </div>
          </div>
          <p className="text-xs text-ink-400 dark:text-paper-300 text-center max-w-[200px]">
            Based on kanji completion
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-4 border border-paper-300 dark:border-ink-300">
        <p className="text-xs text-ink-400 dark:text-paper-300">
          <strong className="text-ink-100 dark:text-paper-100">Note:</strong> Jōyō kanji grades
          are based on the Japanese school curriculum for native speakers. The JLPT estimates
          shown are approximate correlations, not official mappings. Learning order for non-native
          speakers often differs.
        </p>
      </div>
    </div>
  )
}
