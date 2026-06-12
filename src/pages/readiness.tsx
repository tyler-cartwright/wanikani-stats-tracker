import { useState, useMemo } from 'react'
import { useSubjects, useAssignments } from '@/lib/api/queries'
import { enrichSubjectsWithSRS } from '@/lib/calculations/kanji-grid'
import { calculateJLPTReadiness } from '@/lib/calculations/jlpt-readiness'
import { calculateNewsFrequencyCoverage } from '@/lib/calculations/frequency-coverage'
import { useSettingsStore } from '@/stores/settings-store'
import { useSyncStore } from '@/stores/sync-store'
import { JLPTHero } from '@/components/jlpt/jlpt-hero'
import { FrequencyCoverageSection } from '@/components/jlpt/frequency-coverage-section'
import { JLPTLevelCard } from '@/components/jlpt/jlpt-level-card'
import { JLPTLevelDetail } from '@/components/jlpt/jlpt-level-detail'
import { Modal, ModalClose } from '@/components/shared/modal'
import type { JoyoGrade } from '@/data/jlpt'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function Readiness() {
  useDocumentTitle('Readiness')
  const { jlptThreshold } = useSettingsStore()
  const [selectedGrade, setSelectedGrade] = useState<JoyoGrade | null>(null)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  // Fetch data
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useSubjects()
  const {
    data: assignments,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useAssignments()

  const isLoading = subjectsLoading || assignmentsLoading || isSyncing
  const error = subjectsError || assignmentsError

  // Enrich subjects with assignment data
  const enrichedSubjects = useMemo(() => {
    if (!subjects || !assignments) return []
    return enrichSubjectsWithSRS(subjects, assignments)
  }, [subjects, assignments])

  // Calculate readiness
  const readiness = useMemo(() => {
    if (enrichedSubjects.length === 0) return null
    return calculateJLPTReadiness(enrichedSubjects, jlptThreshold)
  }, [enrichedSubjects, jlptThreshold])

  // Occurrence-weighted text coverage against the news corpus
  const frequencyCoverage = useMemo(
    () => calculateNewsFrequencyCoverage(enrichedSubjects, jlptThreshold),
    [enrichedSubjects, jlptThreshold]
  )

  // Pre-compute selected grade data so it remains available during the modal close animation
  const selectedGradeData = useMemo(
    () => readiness?.grades.find((g) => g.grade === selectedGrade) ?? null,
    [readiness, selectedGrade]
  )

  const handleToggle = (grade: JoyoGrade) => {
    setSelectedGrade(grade)
  }

  // Loading state - skeleton matching actual content structure
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero Skeleton */}
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-9 w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            <div className="h-10 w-40 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          </div>

          {/* Hero - Centered Progress */}
          <div className="mb-10">
            <div className="flex flex-col items-center py-6 space-y-4">
              {/* Small label */}
              <div className="h-3 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              {/* Large grade */}
              <div className="h-12 w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              {/* Complete subtitle */}
              <div className="h-5 w-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              {/* Stats line */}
              <div className="h-4 w-64 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              {/* Divider */}
              <div className="h-px w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
            {/* Badge */}
            <div className="flex justify-center">
              <div className="h-6 w-56 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Three Metrics - Refined */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-3">
                <div className="h-4 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                <div className="h-32 w-32 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
                <div className="h-3 w-28 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-paper-300/50 dark:bg-ink-300/50 rounded-lg p-4 border border-paper-300 dark:border-ink-300">
            <div className="space-y-2">
              <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Text Coverage Skeleton */}
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
          <div className="h-6 w-40 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
          <div className="h-12 w-64 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Grade Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-md"
            >
              <div className="space-y-4">
                <div className="h-8 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                <div className="h-4 w-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6">
          <div className="h-5 w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            <div className="h-3 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-vermillion-500/10 border border-vermillion-500/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-vermillion-500 mb-2">Error Loading Data</h2>
        <p className="text-ink-400 dark:text-paper-300">
          {error instanceof Error ? error.message : 'Failed to load readiness data'}
        </p>
      </div>
    )
  }

  // Empty state
  if (!readiness) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 text-center">
        <h2 className="text-xl font-semibold text-ink-100 dark:text-paper-100 mb-2">
          No Data Available
        </h2>
        <p className="text-ink-400 dark:text-paper-300">
          Complete your initial sync to see exam readiness information.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <JLPTHero readiness={readiness} frequencyCoverage={frequencyCoverage} />

      {/* Text Coverage by Frequency */}
      <FrequencyCoverageSection
        coverage={frequencyCoverage}
        subjects={enrichedSubjects}
        threshold={jlptThreshold}
      />

      {/* Grade Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {readiness.grades.map((gradeData) => (
          <JLPTLevelCard
            key={gradeData.grade}
            data={gradeData}
            isSelected={selectedGrade === gradeData.grade}
            onToggle={() => handleToggle(gradeData.grade)}
          />
        ))}
      </div>

      {/* Grade Detail Modal */}
      <Modal
        isOpen={selectedGrade !== null}
        onClose={() => setSelectedGrade(null)}
        size="xl"
        labelledBy="jlpt-level-detail-title"
      >
        <ModalClose onClose={() => setSelectedGrade(null)} />
        {selectedGradeData && (
          <JLPTLevelDetail
            data={selectedGradeData}
            subjects={enrichedSubjects}
            threshold={jlptThreshold}
          />
        )}
      </Modal>

      {/* Footer Info */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6">
        <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-3">
          About Jōyō Kanji and Progress Tracking
        </h3>
        <div className="text-xs text-ink-400 dark:text-paper-300 space-y-3">
          <p>
            <strong className="text-ink-100 dark:text-paper-100">Jōyō Kanji (常用漢字)</strong>{' '}
            are the 2,136 kanji designated by the Japanese Ministry of Education as standard for
            everyday use. These are organized by school grade (1-6) plus secondary school.
          </p>
          <p>
            Not all Jōyō kanji are available in WaniKani. Progress percentages are calculated based
            only on kanji that exist in WaniKani to accurately reflect what you can study on the
            platform.
          </p>

          {/* JLPT Mapping Table */}
          <div className="bg-paper-100 dark:bg-ink-100 rounded-md p-4 border border-paper-300 dark:border-ink-300">
            <div className="text-xs font-semibold text-ink-100 dark:text-paper-100 mb-3">
              Approximate JLPT Mapping
            </div>
            <div className="grid gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-ink-400 dark:text-paper-300 flex-1">Grade 1 complete</span>
                <span className="text-ink-300 dark:text-paper-400">≈</span>
                <span className="font-semibold text-ink-100 dark:text-paper-100 w-8">N5</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-ink-400 dark:text-paper-300 flex-1">Grades 1-2 complete</span>
                <span className="text-ink-300 dark:text-paper-400">≈</span>
                <span className="font-semibold text-ink-100 dark:text-paper-100 w-8">N4</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-ink-400 dark:text-paper-300 flex-1">Grades 1-4 complete</span>
                <span className="text-ink-300 dark:text-paper-400">≈</span>
                <span className="font-semibold text-ink-100 dark:text-paper-100 w-8">N3</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-ink-400 dark:text-paper-300 flex-1">Grades 1-6 complete</span>
                <span className="text-ink-300 dark:text-paper-400">≈</span>
                <span className="font-semibold text-ink-100 dark:text-paper-100 w-8">N2</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-ink-400 dark:text-paper-300 flex-1">All Jōyō complete</span>
                <span className="text-ink-300 dark:text-paper-400">≈</span>
                <span className="font-semibold text-ink-100 dark:text-paper-100 w-8">N1</span>
              </div>
            </div>
            <p className="text-xs text-ink-400 dark:text-paper-300 mt-3 pt-3 border-t border-paper-300 dark:border-ink-300 italic">
              JLPT tests vocabulary, grammar, listening, and reading comprehension - not just kanji knowledge.
            </p>
          </div>

          <p>
            A grade is considered <strong className="text-ink-100 dark:text-paper-100">Complete</strong>{' '}
            when you have learned 90% or more of the available kanji at your selected SRS threshold.
          </p>
          <p>
            <strong className="text-ink-100 dark:text-paper-100">Text coverage</strong> is measured,
            not estimated: every kanji occurrence in a Japanese news corpus is checked against the
            specific kanji you know at your selected threshold. Frequency data: Japanese Wikinews
            corpus via{' '}
            <a
              href="https://github.com/scriptin/kanji-frequency"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-ink-100 dark:hover:text-paper-100 transition-smooth"
            >
              scriptin/kanji-frequency
            </a>{' '}
            (CC BY 4.0). News text skews toward politics, places, and numbers — coverage of fiction
            or casual writing will differ.
          </p>
        </div>
      </div>
    </div>
  )
}
