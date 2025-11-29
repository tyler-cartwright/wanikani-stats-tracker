import { cn } from '@/lib/utils/cn'
import { Lightbulb, Sunrise } from 'lucide-react'

interface HourData {
  hour: string
  accuracy: number | null // null for no data
}

const mockHourData: HourData[] = [
  { hour: '12a', accuracy: null },
  { hour: '2a', accuracy: null },
  { hour: '4a', accuracy: null },
  { hour: '6a', accuracy: 88 },
  { hour: '8a', accuracy: 94 },
  { hour: '10a', accuracy: 93 },
  { hour: '12p', accuracy: 89 },
  { hour: '2p', accuracy: 87 },
  { hour: '4p', accuracy: 86 },
  { hour: '6p', accuracy: 85 },
  { hour: '8p', accuracy: 82 },
  { hour: '10p', accuracy: 79 },
]

const getIntensityClass = (accuracy: number | null) => {
  if (accuracy === null) return 'bg-paper-300 dark:bg-ink-300'
  if (accuracy >= 90) return 'bg-patina-500 dark:bg-patina-400'
  if (accuracy >= 85) return 'bg-patina-500/70 dark:bg-patina-400/70'
  if (accuracy >= 80) return 'bg-vermillion-500/50 dark:bg-vermillion-400/50'
  return 'bg-vermillion-500 dark:bg-vermillion-400'
}

export function TimeHeatmap() {
  const bestHour = '8-9 AM'
  const bestAccuracy = 94
  const worstHour = '10-11 PM'
  const worstAccuracy = 79

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-paper-200/80 dark:bg-ink-200/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
        <div className="text-center p-6">
          <div className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
            Coming Soon
          </div>
          <div className="text-sm text-ink-400 dark:text-paper-300">
            Time-based analysis requires review timestamp data
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Performance by Time of Day
        </h2>
        <div className="flex items-center gap-2 text-sm text-patina-500 dark:text-patina-400">
          <Sunrise className="w-4 h-4" />
          <span className="font-medium">Morning Person</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-6">
        <div className="grid grid-cols-12 gap-2">
          {mockHourData.map((item) => (
            <div key={item.hour} className="space-y-2">
              <div
                className={cn(
                  'aspect-square rounded-md transition-smooth hover:scale-105',
                  getIntensityClass(item.accuracy)
                )}
                title={
                  item.accuracy ? `${item.hour}: ${item.accuracy}%` : 'No data'
                }
              />
              <div className="text-xs text-center text-ink-400 dark:text-paper-300">
                {item.hour}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 text-sm mb-6">
        <div>
          <span className="text-ink-400 dark:text-paper-300">Best:</span>{' '}
          <span className="text-patina-500 dark:text-patina-400 font-semibold">
            {bestHour} ({bestAccuracy}%)
          </span>
        </div>
        <div>
          <span className="text-ink-400 dark:text-paper-300">Worst:</span>{' '}
          <span className="text-vermillion-500 dark:text-vermillion-400 font-semibold">
            {worstHour} ({worstAccuracy}%)
          </span>
        </div>
      </div>

      {/* Insight */}
      <div className="p-4 bg-patina-500/10 dark:bg-patina-500/20 border border-patina-500/20 dark:border-patina-500/30 rounded-lg">
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 text-patina-500 dark:text-patina-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-100 dark:text-paper-100">
            You perform best in the morning. Schedule difficult reviews before
            noon for better retention.
          </div>
        </div>
      </div>
    </div>
  )
}
