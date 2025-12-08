import { useSettingsStore } from '@/stores/settings-store'
import { SRS_THRESHOLD_LABELS, SRS_THRESHOLD_DESCRIPTIONS, type SRSThreshold } from '@/data/jlpt'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

export function JLPTThresholdSelect() {
  const { jlptThreshold, setJlptThreshold } = useSettingsStore()
  const [isOpen, setIsOpen] = useState(false)

  const thresholds: SRSThreshold[] = ['apprentice_4', 'guru', 'master', 'enlightened', 'burned']

  const handleSelect = (threshold: SRSThreshold) => {
    setJlptThreshold(threshold)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-paper-300 dark:border-ink-300 bg-paper-200 dark:bg-ink-200 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth text-ink-100 dark:text-paper-100 text-sm focus-ring"
      >
        <span>Threshold: {SRS_THRESHOLD_LABELS[jlptThreshold]}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-paper-200 dark:bg-ink-200 border border-paper-300 dark:border-ink-300 rounded-lg shadow-lg z-20 overflow-hidden">
            {thresholds.map((threshold) => (
              <button
                key={threshold}
                onClick={() => handleSelect(threshold)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth border-b border-paper-300 dark:border-ink-300 last:border-b-0',
                  threshold === jlptThreshold && 'bg-vermillion-100/10 dark:bg-vermillion-500/10'
                )}
              >
                <div className="font-medium text-ink-100 dark:text-paper-100 mb-1">
                  {SRS_THRESHOLD_LABELS[threshold]}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  {SRS_THRESHOLD_DESCRIPTIONS[threshold]}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
