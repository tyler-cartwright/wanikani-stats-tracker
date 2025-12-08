import type { JoyoLevelData } from '@/data/jlpt'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ProgressBar } from '@/components/shared/progress-bar'

interface JLPTLevelCardProps {
  data: JoyoLevelData
  isExpanded: boolean
  onToggle: () => void
}

export function JLPTLevelCard({ data, isExpanded, onToggle }: JLPTLevelCardProps) {
  const { label, ageRange, kanji, isComplete } = data

  // Color based on percentage (using app's SRS color scheme for consistency)
  const getColor = () => {
    if (kanji.percentage >= 90) return 'text-srs-master'
    if (kanji.percentage >= 70) return 'text-srs-enlightened'
    return 'text-vermillion-500'
  }

  const color = getColor()

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-md hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-2xl font-display font-bold text-ink-100 dark:text-paper-100">
              {label}
            </h3>
            <p className="text-xs text-ink-400 dark:text-paper-300 mt-1">{ageRange}</p>
          </div>
          {isComplete && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-patina-500/20 text-patina-500 dark:bg-patina-500/30">
              Complete!
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <ChevronDown
            className={cn(
              'w-5 h-5 text-ink-400 dark:text-paper-300 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Kanji Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400 dark:text-paper-300">Kanji:</span>
          <span className="font-medium text-ink-100 dark:text-paper-100">
            {kanji.known}/{kanji.inWanikani}
            <span className="text-ink-400 dark:text-paper-300 text-xs ml-1">
              ({kanji.percentage}%)
            </span>
          </span>
        </div>

        {/* Note about coverage */}
        {kanji.inWanikani < kanji.total && (
          <div className="text-xs text-ink-400 dark:text-paper-300 pt-2 border-t border-paper-300 dark:border-ink-300">
            {kanji.total - kanji.inWanikani} kanji not in WaniKani
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400 dark:text-paper-300">Progress:</span>
          <span className={cn('font-bold text-lg', color)}>{kanji.percentage}%</span>
        </div>
        <ProgressBar
          value={kanji.percentage}
          color={
            kanji.percentage >= 90
              ? 'bg-srs-master'
              : kanji.percentage >= 70
              ? 'bg-srs-enlightened'
              : 'bg-vermillion-500'
          }
        />
      </div>
    </div>
  )
}
