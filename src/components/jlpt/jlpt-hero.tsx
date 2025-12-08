import type { JoyoReadinessResult } from '@/data/jlpt'
import { JOYO_GRADE_INFO } from '@/data/jlpt'
import { JLPTProgressRing } from './jlpt-progress-ring'
import { JLPTThresholdSelect } from './jlpt-threshold-select'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import { GraduationCap, BookOpen, Award } from 'lucide-react'

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

  // Calculate overall percentage
  const overallPercentage =
    totalKanjiInWanikani > 0 ? Math.round((totalKanjiKnown / totalKanjiInWanikani) * 100) : 0

  // Get current grade info
  const gradeLabel = currentGrade ? JOYO_GRADE_INFO[currentGrade].label : 'Not Started'

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      {/* Header with threshold selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold text-ink-100 dark:text-paper-100">
          Exam Readiness
        </h1>
        <JLPTThresholdSelect />
      </div>

      {/* Current Grade Badge */}
      <div className="mb-8">
        {currentGrade ? (
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-patina-500/20 dark:bg-patina-500/30 border border-patina-500/30">
            <GraduationCap className="w-6 h-6 text-patina-500" />
            <div>
              <div className="text-sm text-ink-400 dark:text-paper-300">Current Progress</div>
              <div className="text-2xl font-bold text-patina-500">{gradeLabel} Complete</div>
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-paper-300 dark:bg-ink-300 border border-paper-300 dark:border-ink-300">
            <GraduationCap className="w-6 h-6 text-ink-400 dark:text-paper-300" />
            <div>
              <div className="text-sm text-ink-400 dark:text-paper-300">
                Keep studying to complete Grade 1!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Three Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Kanji Progress Ring */}
        <div className="flex flex-col items-center">
          <JLPTProgressRing
            percentage={overallPercentage}
            label="Jōyō Kanji"
            count={`${totalKanjiKnown}/${totalKanjiInWanikani}`}
            size={140}
            strokeWidth={12}
          />
          <p className="text-xs text-ink-400 dark:text-paper-300 mt-3 text-center">
            {totalKanjiInWanikani} of 2,136 Jōyō kanji are in WaniKani
          </p>
        </div>

        {/* Frequency Coverage */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-ochre-500" />
            <div className="text-5xl font-bold text-ochre-500">{frequencyCoverage}%</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
              Reading Coverage
            </div>
            <InfoTooltip content="Based on kanji frequency in newspapers. This estimates what percentage of kanji you'll encounter in real text. Note: Jōyō kanji are organized by grade level, not strict frequency, so actual coverage may vary." />
          </div>
          <p className="text-xs text-ink-400 dark:text-paper-300 mt-2 text-center max-w-[200px]">
            Estimated coverage of kanji in real-world Japanese text
          </p>
        </div>

        {/* JLPT Approximation */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-8 h-8 text-vermillion-500" />
            <div className="text-5xl font-bold text-vermillion-500">
              {approximateJlpt || '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
              Approximate JLPT
            </div>
            <InfoTooltip content="Rough mapping based on grade completion: Grade 1 → N5, Grades 1-2 → N4, Grades 1-4 → N3, Grades 1-6 → N2, All Jōyō → N1. JLPT tests vocabulary, grammar, and reading comprehension beyond just kanji." />
          </div>
          <p className="text-xs text-ink-400 dark:text-paper-300 mt-2 text-center max-w-[200px]">
            Rough estimate based on kanji completion
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
