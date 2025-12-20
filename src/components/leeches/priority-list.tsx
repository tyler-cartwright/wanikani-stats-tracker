import { useState, useMemo } from 'react'
import { useReviewStatistics, useSubjects, useAssignments } from '@/lib/api/queries'
import { detectLeeches, type LeechItem } from '@/lib/calculations/leeches'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { LeechDetailModal } from './leech-detail-modal'

interface DisplayLeechItem {
  rank: number
  character: string
  meaning: string
  accuracy: number
  reviews: number
  severity: number
  focus: string
  reading: string | null
  readingType: 'onyomi' | 'kunyomi' | null
  fullLeech: LeechItem
}

export function PriorityList() {
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const includeBurnedLeeches = useSettingsStore((state) => state.includeBurnedLeeches)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [selectedLeech, setSelectedLeech] = useState<LeechItem | null>(null)

  const isLoading = statsLoading || subjectsLoading || assignmentsLoading || isSyncing

  const leeches = reviewStats && subjects && assignments
    ? detectLeeches(reviewStats, subjects, assignments, { includeBurned: includeBurnedLeeches })
    : []

  // Convert all leeches to display format
  const allDisplayLeeches: DisplayLeechItem[] = useMemo(() => {
    return leeches.map((leech, idx) => {
      const meaningDiff = 100 - leech.meaningAccuracy
      const readingDiff = 100 - leech.readingAccuracy
      const focus = meaningDiff > readingDiff ? 'Meaning' : 'Reading'

      return {
        rank: idx + 1,
        character: leech.character,
        meaning: leech.meaning,
        accuracy: leech.accuracy,
        reviews: leech.totalReviews,
        severity: leech.severity,
        focus,
        reading: leech.readings.primary,
        readingType: leech.readings.primaryType,
        fullLeech: leech,
      }
    })
  }, [leeches])

  // Pagination
  const totalPages = Math.ceil(allDisplayLeeches.length / itemsPerPage)
  const displayLeeches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return allDisplayLeeches.slice(start, start + itemsPerPage)
  }, [allDisplayLeeches, currentPage, itemsPerPage])

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Priority Study List
        </h2>
        <span className="text-sm text-vermillion-500 dark:text-vermillion-400 font-semibold">
          {leeches.length} leeches
        </span>
      </div>

      {displayLeeches.length === 0 ? (
        <div className="text-center py-12 text-ink-400 dark:text-paper-300">
          <p className="text-lg font-medium mb-2">No leeches detected!</p>
          <p className="text-sm">You're doing great. Keep up the excellent work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayLeeches.map((item) => (
            <div
              key={item.rank}
              onClick={() => setSelectedLeech(item.fullLeech)}
              className="p-4 rounded-lg border border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vermillion-500 dark:bg-vermillion-400 text-paper-100 dark:text-ink-100 flex items-center justify-center text-sm font-semibold">
                  {item.rank}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Character and Meaning */}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl font-japanese text-ink-100 dark:text-paper-100">
                      {item.character}
                    </span>
                    <span className="text-base text-ink-300 dark:text-paper-300">{item.meaning}</span>
                    {item.reading && (
                      <span className="text-sm font-japanese text-ink-400 dark:text-paper-300">
                        {item.reading}
                        {item.readingType && (
                          <span className="text-xs ml-1">
                            ({item.readingType === 'onyomi' ? 'on' : 'kun'})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-ink-400 dark:text-paper-300">
                    <span>
                      Accuracy:{' '}
                      <span className="text-vermillion-500 dark:text-vermillion-400 font-semibold">
                        {item.accuracy}%
                      </span>
                    </span>
                    <span>Reviews: {item.reviews}</span>
                    <span>Severity: {item.severity}</span>
                  </div>

                  {/* Focus */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded-md bg-paper-100 dark:bg-ink-100 text-ink-400 dark:text-paper-300 font-medium">
                      Focus: {item.focus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {allDisplayLeeches.length > 0 && (
        <div className="mt-6">
          {/* Per page selector - separate row on mobile */}
          <div className="flex items-center gap-2 mb-3 sm:hidden">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 focus-ring"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-ink-400 dark:text-paper-300">per page</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            {/* Desktop: per page selector on left */}
            <div className="hidden sm:flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 focus-ring"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={100}>100</option>
              </select>
              <span className="text-ink-400 dark:text-paper-300">per page</span>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <>
                {/* Mobile pagination - simple format */}
                <div className="flex sm:hidden items-center justify-center gap-3 w-full">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth text-ink-400 dark:text-paper-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-ink-100 dark:text-paper-100 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth text-ink-400 dark:text-paper-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>

                {/* Desktop pagination - full page numbers */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth text-ink-400 dark:text-paper-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>

                  {/* First page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1 rounded-md transition-smooth ${
                      currentPage === 1
                        ? 'bg-vermillion-500 text-paper-100 dark:text-ink-100 font-medium'
                        : 'hover:bg-paper-300 dark:hover:bg-ink-300 text-ink-400 dark:text-paper-300'
                    }`}
                  >
                    1
                  </button>

                  {/* Show ellipsis if needed */}
                  {currentPage > 3 && <span className="text-ink-400 dark:text-paper-300">...</span>}

                  {/* Show pages around current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1)
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md transition-smooth ${
                          currentPage === page
                            ? 'bg-vermillion-500 text-paper-100 dark:text-ink-100 font-medium'
                            : 'hover:bg-paper-300 dark:hover:bg-ink-300 text-ink-400 dark:text-paper-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  {/* Show ellipsis if needed */}
                  {currentPage < totalPages - 2 && <span className="text-ink-400 dark:text-paper-300">...</span>}

                  {/* Last page */}
                  {totalPages > 1 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-1 rounded-md transition-smooth ${
                        currentPage === totalPages
                          ? 'bg-vermillion-500 text-paper-100 dark:text-ink-100 font-medium'
                          : 'hover:bg-paper-300 dark:hover:bg-ink-300 text-ink-400 dark:text-paper-300'
                      }`}
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth text-ink-400 dark:text-paper-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Leech Detail Modal */}
      <LeechDetailModal
        isOpen={selectedLeech !== null}
        onClose={() => setSelectedLeech(null)}
        leech={selectedLeech}
      />
    </div>
  )
}
