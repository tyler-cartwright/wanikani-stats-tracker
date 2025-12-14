import { Search, Grid2X2, List } from 'lucide-react'
import type { SRSStage } from '@/lib/api/types'
import type { SubjectType } from '@/lib/calculations/kanji-grid'
import { cn } from '@/lib/utils/cn'

interface KanjiGridFiltersProps {
  viewMode: 'flat' | 'grouped'
  onViewModeChange: (mode: 'flat' | 'grouped') => void
  levelRange: [number, number]
  onLevelRangeChange: (range: [number, number]) => void
  srsFilter: SRSStage[]
  onSrsFilterChange: (stages: SRSStage[]) => void
  subjectTypeFilter: SubjectType[]
  onSubjectTypeFilterChange: (types: SubjectType[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  totalCount: number
  filteredCount: number
}

const srsStages: { value: SRSStage; label: string }[] = [
  { value: 'initiate', label: 'Locked' },
  { value: 'apprentice', label: 'Apprentice' },
  { value: 'guru', label: 'Guru' },
  { value: 'master', label: 'Master' },
  { value: 'enlightened', label: 'Enlightened' },
  { value: 'burned', label: 'Burned' },
]

const subjectTypes: { value: SubjectType; label: string; color: string }[] = [
  { value: 'radical', label: 'Radicals', color: 'bg-[#00AAFF]' },
  { value: 'kanji', label: 'Kanji', color: 'bg-[#FF00AA]' },
  { value: 'vocabulary', label: 'Vocabulary', color: 'bg-[#AA00FF]' },
]

export function KanjiGridFilters({
  viewMode,
  onViewModeChange,
  levelRange,
  onLevelRangeChange,
  srsFilter,
  onSrsFilterChange,
  subjectTypeFilter,
  onSubjectTypeFilterChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
}: KanjiGridFiltersProps) {
  const toggleSrsStage = (stage: SRSStage) => {
    if (srsFilter.includes(stage)) {
      onSrsFilterChange(srsFilter.filter((s) => s !== stage))
    } else {
      onSrsFilterChange([...srsFilter, stage])
    }
  }

  const toggleSubjectType = (type: SubjectType) => {
    if (subjectTypeFilter.includes(type)) {
      onSubjectTypeFilterChange(subjectTypeFilter.filter((t) => t !== type))
    } else {
      onSubjectTypeFilterChange([...subjectTypeFilter, type])
    }
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle and Count */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-paper-200 dark:bg-ink-200 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('flat')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'flat'
                ? 'bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 shadow-sm'
                : 'text-ink-300 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
            )}
          >
            <Grid2X2 className="w-4 h-4" />
            Flat
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grouped')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'grouped'
                ? 'bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 shadow-sm'
                : 'text-ink-300 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
            )}
          >
            <List className="w-4 h-4" />
            By Level
          </button>
        </div>

        <div className="text-sm text-ink-300 dark:text-paper-300">
          Showing <span className="font-medium text-ink-100 dark:text-paper-100">{filteredCount}</span> of{' '}
          <span className="font-medium">{totalCount}</span> items
        </div>
      </div>

      {/* Search and Level Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 dark:text-paper-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search character, meaning, or reading..."
            className="w-full pl-10 pr-4 py-2 bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 placeholder-ink-300 dark:placeholder-paper-300 border border-paper-300 dark:border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500"
          />
        </div>

        {/* Level Range */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-ink-200 dark:text-paper-200 whitespace-nowrap">
            Levels:
          </label>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              min={1}
              max={60}
              value={levelRange[0]}
              onChange={(e) => {
                const min = Math.max(1, Math.min(60, parseInt(e.target.value) || 1))
                onLevelRangeChange([min, Math.max(min, levelRange[1])])
              }}
              className="w-16 px-2 py-1.5 bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 border border-paper-300 dark:border-ink-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-vermillion-500"
            />
            <span className="text-ink-300 dark:text-paper-300">to</span>
            <input
              type="number"
              min={1}
              max={60}
              value={levelRange[1]}
              onChange={(e) => {
                const max = Math.max(1, Math.min(60, parseInt(e.target.value) || 60))
                onLevelRangeChange([Math.min(levelRange[0], max), max])
              }}
              className="w-16 px-2 py-1.5 bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 border border-paper-300 dark:border-ink-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-vermillion-500"
            />
          </div>
        </div>
      </div>

      {/* Subject Type Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink-200 dark:text-paper-200">Item Types:</label>
        <div className="flex flex-wrap gap-2">
          {subjectTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleSubjectType(type.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border-2',
                subjectTypeFilter.includes(type.value) || subjectTypeFilter.length === 0
                  ? `${type.color} text-paper-100 border-transparent`
                  : 'bg-paper-200 dark:bg-ink-200 text-ink-300 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-current'
              )}
            >
              {type.label}
            </button>
          ))}
          {subjectTypeFilter.length > 0 && subjectTypeFilter.length < 3 && (
            <button
              type="button"
              onClick={() => onSubjectTypeFilterChange([])}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-ink-300 dark:text-paper-300 hover:text-vermillion-500 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SRS Stage Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink-200 dark:text-paper-200">SRS Stages:</label>
        <div className="flex flex-wrap gap-2">
          {srsStages.map((stage) => {
            const isActive = srsFilter.includes(stage.value) || srsFilter.length === 0

            // Color mapping to match kanji block colors
            const stageColors = {
              initiate: isActive
                ? 'bg-paper-300 dark:bg-ink-300 text-ink-100 dark:text-paper-100 border-paper-400 dark:border-ink-400'
                : 'bg-paper-200 dark:bg-ink-200 text-ink-400 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-paper-400 dark:hover:border-ink-400',
              apprentice: isActive
                ? 'bg-srs-apprentice text-paper-100 dark:text-ink-100 border-srs-apprentice'
                : 'bg-paper-200 dark:bg-ink-200 text-ink-400 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-srs-apprentice',
              guru: isActive
                ? 'bg-srs-guru text-paper-100 dark:text-ink-100 border-srs-guru'
                : 'bg-paper-200 dark:bg-ink-200 text-ink-400 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-srs-guru',
              master: isActive
                ? 'bg-srs-master text-paper-100 dark:text-ink-100 border-srs-master'
                : 'bg-paper-200 dark:bg-ink-200 text-ink-400 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-srs-master',
              enlightened: isActive
                ? 'bg-srs-enlightened text-paper-100 dark:text-ink-100 border-srs-enlightened'
                : 'bg-paper-200 dark:bg-ink-200 text-ink-400 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-srs-enlightened',
              burned: isActive
                ? 'bg-srs-burned text-paper-100 dark:text-ink-100 border-srs-burned'
                : 'bg-paper-200 dark:bg-ink-200 text-ink-400 dark:text-paper-300 border-paper-300 dark:border-ink-300 hover:border-srs-burned',
            }

            return (
              <button
                key={stage.value}
                type="button"
                onClick={() => toggleSrsStage(stage.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  stageColors[stage.value]
                )}
              >
                {stage.label}
              </button>
            )
          })}
          {srsFilter.length > 0 && (
            <button
              type="button"
              onClick={() => onSrsFilterChange([])}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-ink-300 dark:text-paper-300 hover:text-vermillion-500 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
