import { useEffect, useRef, useState } from 'react'
import type { EnrichedSubject } from '@/lib/calculations/kanji-grid'
import { SRSBadge } from '@/components/shared/srs-badge'
import { RadicalGlyph } from './radical-glyph'
import { useSettingsStore } from '@/stores/settings-store'

interface KanjiTooltipProps {
  subject: EnrichedSubject | null
  position: { x: number; y: number }
  visible: boolean
}

export function KanjiTooltip({ subject, position, visible }: KanjiTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const theme = useSettingsStore((state) => state.theme)

  // Adjust position to avoid overflow
  useEffect(() => {
    if (!tooltipRef.current || !visible) return

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = position

    // Adjust horizontal position
    if (x + rect.width > viewportWidth - 16) {
      x = viewportWidth - rect.width - 16
    }
    if (x < 16) {
      x = 16
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight - 16) {
      y = position.y - rect.height - 16 // Position above cursor
    }

    setAdjustedPosition({ x, y })
  }, [position, visible])

  if (!visible || !subject) {
    return null
  }

  // Format subject type for display
  const formatSubjectType = (type: string) => {
    if (type === 'kana_vocabulary') return 'Kana Vocabulary'
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="bg-paper-100 dark:bg-ink-100 border border-paper-400 dark:border-ink-400 rounded-lg shadow-lg p-3 min-w-[200px]">
        <div className="flex items-start gap-3">
          {/* Character or Image */}
          <div className="text-3xl font-medium text-ink-100 dark:text-paper-100">
            {subject.character ? (
              subject.character
            ) : subject.characterImageUrl ? (
              <RadicalGlyph
                url={subject.characterImageUrl}
                label={subject.primaryMeaning}
                invert={theme === 'dark' || subject.srsStage === 9}
                className="w-8 h-8"
              />
            ) : (
              <span className="text-ink-300 dark:text-paper-300">?</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium text-ink-100 dark:text-paper-100">{subject.primaryMeaning}</div>
            {subject.primaryReading && (
              <div className="text-xs text-ink-300 dark:text-paper-300">
                {subject.primaryReading}
                {subject.readingType && ` (${subject.readingType})`}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-ink-300 dark:text-paper-300">
                {formatSubjectType(subject.subjectType)} · Level {subject.level}
              </span>
              <SRSBadge stage={subject.srsStageName} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
