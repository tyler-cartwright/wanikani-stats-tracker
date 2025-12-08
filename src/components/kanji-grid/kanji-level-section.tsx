import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SubjectsByLevel, EnrichedSubject } from '@/lib/calculations/kanji-grid'
import { KanjiCell } from './kanji-cell'

interface KanjiLevelSectionProps {
  levelData: SubjectsByLevel
  onSubjectClick: (subject: EnrichedSubject) => void
  onSubjectHover: (subject: EnrichedSubject | null, event?: React.MouseEvent) => void
}

export function KanjiLevelSection({ levelData, onSubjectClick, onSubjectHover }: KanjiLevelSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect() // Only need to observe once
        }
      },
      { rootMargin: '200px' } // Preload slightly before visible
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const { stats } = levelData

  // Calculate highest stage count for badge display
  const highestStage = (() => {
    if (stats.burned > 0) return `${stats.burned}/${stats.total} burned`
    if (stats.enlightened > 0) return `${stats.enlightened}/${stats.total} enlightened`
    if (stats.master > 0) return `${stats.master}/${stats.total} master`
    if (stats.guru > 0) return `${stats.guru}/${stats.total} guru`
    if (stats.apprentice > 0) return `${stats.apprentice}/${stats.total} apprentice`
    return `${stats.locked}/${stats.total} locked`
  })()

  return (
    <div ref={ref} className="space-y-3">
      {/* Level Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 w-full group"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-ink-300 dark:text-paper-300 transition-transform group-hover:text-ink-100 dark:group-hover:text-paper-100" />
          ) : (
            <ChevronRight className="w-5 h-5 text-ink-300 dark:text-paper-300 transition-transform group-hover:text-ink-100 dark:group-hover:text-paper-100" />
          )}
          <h3 className="text-lg font-medium text-ink-100 dark:text-paper-100">Level {levelData.level}</h3>
        </div>

        <div className="text-sm text-ink-300 dark:text-paper-300">{highestStage}</div>

        <div className="flex-1 h-px bg-paper-300 dark:bg-ink-300" />
      </button>

      {/* Subject Grid */}
      {isExpanded && (
        <>
          {isInView ? (
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {levelData.subjects.map((subject) => (
                <KanjiCell
                  key={subject.id}
                  subject={subject}
                  onClick={() => onSubjectClick(subject)}
                  onMouseEnter={(e) => onSubjectHover(subject, e)}
                  onMouseLeave={() => onSubjectHover(null)}
                />
              ))}
            </div>
          ) : (
            // Placeholder to maintain layout
            <div style={{ height: `${Math.ceil(levelData.subjects.length / 15) * 50}px` }} />
          )}
        </>
      )}
    </div>
  )
}
