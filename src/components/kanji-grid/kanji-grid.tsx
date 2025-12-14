import { useState, useMemo, useDeferredValue } from 'react'
import { useSubjects } from '@/lib/api/queries'
import { useAssignments } from '@/lib/api/queries'
import type { SRSStage } from '@/lib/api/types'
import type { EnrichedSubject, SubjectType } from '@/lib/calculations/kanji-grid'
import {
  enrichSubjectsWithSRS,
  filterSubjects,
  groupSubjectsByLevel,
} from '@/lib/calculations/kanji-grid'
import { excludeHiddenSubjects } from '@/lib/utils/filters'
import { KanjiGridFilters } from './kanji-grid-filters'
import { KanjiGridLegend } from './kanji-grid-legend'
import { KanjiLevelSection } from './kanji-level-section'
import { KanjiCell } from './kanji-cell'
import { KanjiTooltip } from './kanji-tooltip'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTouchDevice } from '@/hooks/use-touch-device'

export function KanjiGrid() {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const showHiddenItems = useSettingsStore((state) => state.showHiddenItems)
  const isTouchDevice = useTouchDevice()

  // Filter state
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('grouped')
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 60])
  const [srsFilter, setSrsFilter] = useState<SRSStage[]>([])
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<SubjectType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Tooltip state
  const [tooltipSubject, setTooltipSubject] = useState<EnrichedSubject | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Selection state for touch devices
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)

  const isLoading = subjectsLoading || assignmentsLoading || isSyncing

  // Step 1: Enrich subjects with SRS data and filter hidden items
  const enrichedSubjects = useMemo(() => {
    if (!subjects || !assignments) return []
    const enriched = enrichSubjectsWithSRS(subjects, assignments)
    // Filter out hidden items unless user wants to see them
    return showHiddenItems ? enriched : excludeHiddenSubjects(enriched)
  }, [subjects, assignments, showHiddenItems])

  // Step 2: Apply filters
  const filteredSubjects = useMemo(() => {
    return filterSubjects(enrichedSubjects, {
      levelRange,
      srsStages: srsFilter.length > 0 ? srsFilter : undefined,
      subjectTypes: subjectTypeFilter.length > 0 ? subjectTypeFilter : undefined,
      searchQuery: deferredSearchQuery,
    })
  }, [enrichedSubjects, levelRange, srsFilter, subjectTypeFilter, deferredSearchQuery])

  // Step 3: Group by level (if needed)
  const subjectsByLevel = useMemo(() => {
    return viewMode === 'grouped' ? groupSubjectsByLevel(filteredSubjects) : null
  }, [filteredSubjects, viewMode])

  // Calculate SRS distribution for legend
  const srsDistribution = useMemo(() => {
    const dist: Record<SRSStage, number> = {
      initiate: 0,
      apprentice: 0,
      guru: 0,
      master: 0,
      enlightened: 0,
      burned: 0,
    }

    filteredSubjects.forEach((subject) => {
      dist[subject.srsStageName] = (dist[subject.srsStageName] || 0) + 1
    })

    return dist
  }, [filteredSubjects])

  // Handlers
  const handleSubjectClick = (subject: EnrichedSubject, event: React.MouseEvent<HTMLButtonElement>) => {
    if (isTouchDevice) {
      // Touch device: tap-to-select pattern
      if (selectedSubjectId === subject.id) {
        // Second tap - navigate to WaniKani
        window.open(subject.documentUrl, '_blank', 'noopener,noreferrer')
      } else {
        // First tap - select and show tooltip
        setSelectedSubjectId(subject.id)
        setTooltipSubject(subject)

        // Position tooltip at center-bottom of the tapped cell
        const button = event.currentTarget
        const rect = button.getBoundingClientRect()
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
        })
      }
    } else {
      // Non-touch device: navigate immediately
      window.open(subject.documentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSubjectHover = (subject: EnrichedSubject | null, event?: React.MouseEvent) => {
    // Only handle hover on non-touch devices
    if (!isTouchDevice) {
      if (subject && event) {
        setTooltipSubject(subject)
        setTooltipPosition({ x: event.clientX + 16, y: event.clientY + 16 })
      } else {
        setTooltipSubject(null)
      }
    }
  }

  // Deselect when tapping outside cells on touch devices
  const handleContainerClick = () => {
    if (isTouchDevice && selectedSubjectId !== null) {
      setSelectedSubjectId(null)
      setTooltipSubject(null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div>
          <div className="h-9 w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-2" />
          <div className="h-5 w-full max-w-2xl bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-xl p-4 sm:p-6">
          <div className="space-y-4">
            {/* View mode and count */}
            <div className="flex items-center justify-between">
              <div className="h-10 w-40 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
              <div className="h-5 w-32 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
            </div>
            {/* Search and level range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
              <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
            </div>
            {/* Type filters */}
            <div className="space-y-2">
              <div className="h-5 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-24 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            {/* SRS filters */}
            <div className="space-y-2">
              <div className="h-5 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 w-24 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend Skeleton */}
        <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-xl p-4 sm:p-6">
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="min-w-10 h-10 sm:min-w-12 sm:h-12 bg-paper-300 dark:bg-ink-300 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (enrichedSubjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-300 dark:text-paper-300">No subjects found. Start learning to see them here!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink-100 dark:text-paper-100">Subject Grid</h1>
        <p className="mt-2 text-ink-300 dark:text-paper-300">
          Visual overview of all radicals, kanji, and vocabulary colored by SRS stage. Click any item to view
          details on WaniKani.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-xl p-4 sm:p-6">
        <KanjiGridFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          levelRange={levelRange}
          onLevelRangeChange={setLevelRange}
          srsFilter={srsFilter}
          onSrsFilterChange={setSrsFilter}
          subjectTypeFilter={subjectTypeFilter}
          onSubjectTypeFilterChange={setSubjectTypeFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={enrichedSubjects.length}
          filteredCount={filteredSubjects.length}
        />
      </div>

      {/* Legend */}
      <div className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-xl p-4">
        <KanjiGridLegend distribution={srsDistribution} />
      </div>

      {/* Grid */}
      <div
        className="bg-paper-100 dark:bg-ink-100 border border-paper-300 dark:border-ink-300 rounded-xl p-4 sm:p-6"
        onClick={handleContainerClick}
      >
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-300 dark:text-paper-300">No items match your filters.</p>
          </div>
        ) : viewMode === 'grouped' && subjectsByLevel ? (
          <div className="space-y-6">
            {subjectsByLevel.map((levelData) => (
              <KanjiLevelSection
                key={levelData.level}
                levelData={levelData}
                selectedSubjectId={selectedSubjectId}
                onSubjectClick={handleSubjectClick}
                onSubjectHover={handleSubjectHover}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {filteredSubjects.map((subject) => (
              <KanjiCell
                key={subject.id}
                subject={subject}
                isSelected={selectedSubjectId === subject.id}
                onClick={(e) => {
                  e.stopPropagation() // Prevent container click
                  handleSubjectClick(subject, e)
                }}
                onMouseEnter={(e) => handleSubjectHover(subject, e)}
                onMouseLeave={() => handleSubjectHover(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <KanjiTooltip subject={tooltipSubject} position={tooltipPosition} visible={!!tooltipSubject} />
    </div>
  )
}
