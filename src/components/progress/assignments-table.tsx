import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { SRSBadge } from '@/components/shared/srs-badge'
import { useAssignments, useSubjects, useReviewStatistics } from '@/lib/api/queries'
import { getSRSStageName, type SRSStage } from '@/lib/api/types'

interface EnrichedAssignment {
  id: number
  character: string
  meaning: string
  type: 'Radical' | 'Kanji' | 'Vocabulary'
  level: number
  srs: SRSStage
  accuracy: number
}

export function AssignmentsTable() {
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()

  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [srsFilter, setSrsFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const isLoading = assignmentsLoading || subjectsLoading || statsLoading

  // Create lookup maps
  const subjectMap = useMemo(() => {
    if (!subjects) return new Map()
    return new Map(subjects.map(s => [s.id, s]))
  }, [subjects])

  const reviewStatsMap = useMemo(() => {
    if (!reviewStats) return new Map()
    return new Map(reviewStats.map(rs => [rs.subject_id, rs]))
  }, [reviewStats])

  // Enrich assignments with subject and review stats data
  const enrichedAssignments = useMemo<EnrichedAssignment[]>(() => {
    if (!assignments || !subjects) return []

    return assignments
      .filter(a => a.started_at !== null) // Only show started assignments
      .map(assignment => {
        const subject = subjectMap.get(assignment.subject_id)
        const stats = reviewStatsMap.get(assignment.subject_id)

        if (!subject) return null

        // Calculate accuracy
        let accuracy = 0
        if (stats) {
          const meaningCorrect = stats.meaning_correct || 0
          const meaningIncorrect = stats.meaning_incorrect || 0
          const readingCorrect = stats.reading_correct || 0
          const readingIncorrect = stats.reading_incorrect || 0
          const totalCorrect = meaningCorrect + readingCorrect
          const totalIncorrect = meaningIncorrect + readingIncorrect
          const total = totalCorrect + totalIncorrect
          accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 100
        } else {
          accuracy = 100 // No stats yet means no reviews, so 100%
        }

        // Get character/meaning based on subject type
        let character = ''
        let meaning = ''
        let type: 'Radical' | 'Kanji' | 'Vocabulary' = 'Kanji'

        if ('character_images' in subject) {
          // Radical
          character = subject.characters || '?'
          meaning = subject.meanings[0]?.meaning || ''
          type = 'Radical'
        } else if ('component_subject_ids' in subject && 'readings' in subject && subject.readings.some((r: any) => 'type' in r)) {
          // Kanji (has readings with type)
          character = subject.characters || ''
          meaning = subject.meanings[0]?.meaning || ''
          type = 'Kanji'
        } else {
          // Vocabulary
          character = subject.characters || ''
          meaning = subject.meanings[0]?.meaning || ''
          type = 'Vocabulary'
        }

        return {
          id: subject.id,
          character,
          meaning,
          type,
          level: subject.level,
          srs: getSRSStageName(assignment.srs_stage),
          accuracy,
        }
      })
      .filter((a): a is EnrichedAssignment => a !== null)
  }, [assignments, subjects, subjectMap, reviewStatsMap])

  // Apply filters
  const filteredAssignments = useMemo(() => {
    return enrichedAssignments.filter(assignment => {
      // Type filter
      if (typeFilter !== 'all' && assignment.type.toLowerCase() !== typeFilter) {
        return false
      }

      // SRS filter
      if (srsFilter !== 'all' && assignment.srs !== srsFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          assignment.character.toLowerCase().includes(query) ||
          assignment.meaning.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [enrichedAssignments, typeFilter, srsFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAssignments.slice(start, start + itemsPerPage)
  }, [filteredAssignments, currentPage, itemsPerPage])

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="flex gap-3 mb-6">
          <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse w-32" />
          <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded animate-pulse flex-1" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          All Items
        </h2>
        <span className="text-sm text-ink-400 dark:text-paper-300">
          {filteredAssignments.length} total
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 focus-ring"
        >
          <option value="all">Type: All</option>
          <option value="radical">Radicals</option>
          <option value="kanji">Kanji</option>
          <option value="vocabulary">Vocabulary</option>
        </select>
        <select
          value={srsFilter}
          onChange={(e) => {
            setSrsFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 focus-ring"
        >
          <option value="all">SRS: All</option>
          <option value="apprentice">Apprentice</option>
          <option value="guru">Guru</option>
          <option value="master">Master</option>
          <option value="enlightened">Enlightened</option>
          <option value="burned">Burned</option>
        </select>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-paper-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 placeholder:text-ink-400 dark:placeholder:text-paper-400 focus-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-300 dark:border-ink-300">
              <th className="text-left py-3 px-4 font-semibold text-ink-400 dark:text-paper-300">Character</th>
              <th className="text-left py-3 px-4 font-semibold text-ink-400 dark:text-paper-300">Meaning</th>
              <th className="text-left py-3 px-4 font-semibold text-ink-400 dark:text-paper-300">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-ink-400 dark:text-paper-300">Level</th>
              <th className="text-left py-3 px-4 font-semibold text-ink-400 dark:text-paper-300">SRS</th>
              <th className="text-left py-3 px-4 font-semibold text-ink-400 dark:text-paper-300">Acc</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAssignments.map((item) => (
              <tr
                key={item.id}
                className="border-b border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer"
              >
                <td className="py-3 px-4">
                  <span className="text-xl font-japanese text-ink-100 dark:text-paper-100">
                    {item.character}
                  </span>
                </td>
                <td className="py-3 px-4 text-ink-100 dark:text-paper-100">{item.meaning}</td>
                <td className="py-3 px-4 text-ink-400 dark:text-paper-300">{item.type}</td>
                <td className="py-3 px-4 text-ink-400 dark:text-paper-300">{item.level}</td>
                <td className="py-3 px-4">
                  <SRSBadge stage={item.srs} size="sm" />
                </td>
                <td className="py-3 px-4 text-ink-400 dark:text-paper-300 font-medium">
                  {item.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
            <option value={50}>50</option>
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
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-ink-400 dark:text-paper-300">per page</span>
          </div>

          {/* Mobile: simplified pagination */}
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
    </div>
  )
}
