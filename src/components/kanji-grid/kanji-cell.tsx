import { memo } from 'react'
import { cn } from '@/lib/utils/cn'
import type { EnrichedSubject } from '@/lib/calculations/kanji-grid'
import { getSRSCellClasses, getSubjectTypeColor } from '@/lib/calculations/kanji-grid'
import { RadicalGlyph } from './radical-glyph'
import { useSettingsStore } from '@/stores/settings-store'

interface SubjectCellProps {
  subject: EnrichedSubject
  isSelected?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onMouseEnter: (event: React.MouseEvent) => void
  onMouseLeave: () => void
}

function SubjectCellComponent({ subject, isSelected = false, onClick, onMouseEnter, onMouseLeave }: SubjectCellProps) {
  const theme = useSettingsStore((state) => state.theme)
  // Match text color behavior: light glyph in dark theme or burned stage; dark otherwise
  const invertGlyph = theme === 'dark' || subject.srsStage === 9

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        // Flexible width - expands for vocabulary
        'min-w-10 h-10 sm:min-w-12 sm:h-12',
        // Padding
        'px-1.5',
        // Layout
        'flex items-center justify-center',
        // Text - adjust size for longer words
        subject.character && subject.character.length > 1 ? 'text-base sm:text-lg' : 'text-lg sm:text-xl',
        'font-medium',
        // Style
        'rounded-md',
        'cursor-pointer',
        'transition-all duration-200',
        // Type indicator - colored top border (2px)
        'border-t-2',
        getSubjectTypeColor(subject.subjectType),
        // Hover effects
        'hover:scale-110 hover:shadow-md hover:z-10',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion-500 focus-visible:ring-offset-2',
        // Selected state - ring outline for touch devices
        isSelected && 'ring-2 ring-vermillion-500 ring-offset-2 scale-110 shadow-lg z-10',
        // SRS-based colors
        getSRSCellClasses(subject.srsStage)
      )}
      aria-label={`${subject.character || subject.primaryMeaning} - ${subject.primaryMeaning} - ${subject.srsStageName} - ${subject.subjectType}`}
    >
      {subject.character ? (
        <span>{subject.character}</span>
      ) : subject.characterImageUrl ? (
        <RadicalGlyph
          url={subject.characterImageUrl}
          label={subject.primaryMeaning}
          invert={invertGlyph}
          className="w-6 h-6"
        />
      ) : (
        <span className="text-ink-300 dark:text-paper-300">?</span>
      )}
    </button>
  )
}

// Memoize with custom comparison (only re-render if id, srsStage, or isSelected changes)
export const KanjiCell = memo(SubjectCellComponent, (prevProps, nextProps) => {
  return (
    prevProps.subject.id === nextProps.subject.id &&
    prevProps.subject.srsStage === nextProps.subject.srsStage &&
    prevProps.isSelected === nextProps.isSelected
  )
})
