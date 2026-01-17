import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { InfoTooltip } from '@/components/shared/info-tooltip'

interface LessonPaceSelectorProps {
  lessonsPerDay: number
  onLessonsChange: (value: number) => void
  forecastDays: number
  onForecastDaysChange: (value: number) => void
  isLoading?: boolean
  className?: string
}

const PRESET_PACES = [0, 5, 10, 15, 20]
const PRESET_DAYS = [7, 14, 30, 60, 90, 180]

export function LessonPaceSelector({
  lessonsPerDay,
  onLessonsChange,
  forecastDays,
  onForecastDaysChange,
  isLoading = false,
  className,
}: LessonPaceSelectorProps) {
  const [customPaceValue, setCustomPaceValue] = useState('')
  const [isCustomPaceMode, setIsCustomPaceMode] = useState(
    !PRESET_PACES.includes(lessonsPerDay)
  )

  const [customDaysValue, setCustomDaysValue] = useState('')
  const [isCustomDaysMode, setIsCustomDaysMode] = useState(
    !PRESET_DAYS.includes(forecastDays)
  )

  const handlePresetPaceClick = (pace: number) => {
    setIsCustomPaceMode(false)
    setCustomPaceValue('')
    onLessonsChange(pace)
  }

  const handleCustomPaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setCustomPaceValue(inputValue)

    const numValue = parseInt(inputValue, 10)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 999) {
      setIsCustomPaceMode(true)
      onLessonsChange(numValue)
    }
  }

  const handlePresetDaysClick = (days: number) => {
    setIsCustomDaysMode(false)
    setCustomDaysValue('')
    onForecastDaysChange(days)
  }

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setCustomDaysValue(inputValue)

    const numValue = parseInt(inputValue, 10)
    if (!isNaN(numValue)) {
      // Clamp to valid range: 7-180 days
      const clampedValue = Math.max(7, Math.min(180, numValue))
      setIsCustomDaysMode(true)
      onForecastDaysChange(clampedValue)

      // Update display to show clamped value if different
      if (clampedValue !== numValue) {
        setCustomDaysValue(clampedValue.toString())
      }
    }
  }

  const isPacePresetActive = (pace: number) => !isCustomPaceMode && lessonsPerDay === pace
  const isDaysPresetActive = (days: number) => !isCustomDaysMode && forecastDays === days

  if (isLoading) {
    return (
      <div className={cn("bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm", className)}>
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 flex-1 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
        </div>
        <div className="pt-6 border-t border-paper-300 dark:border-ink-300">
          <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-10 bg-paper-300 dark:bg-ink-300 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm", className)}>
      {/* Lesson Pace Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
            Lesson Pace
          </h2>
          <InfoTooltip content="How many new lessons to do each day, starting tomorrow (assumes you may have already done lessons today). Each lesson creates multiple reviews over time as the item moves through the SRS stages. For example, 15 lessons = about 30-40 reviews on the first day." />
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_PACES.map((pace) => (
            <button
              key={pace}
              onClick={() => handlePresetPaceClick(pace)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-smooth focus-ring',
                isPacePresetActive(pace)
                  ? 'bg-vermillion-500 text-white'
                  : 'bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 border border-paper-300 dark:border-ink-300 hover:border-vermillion-500 dark:hover:border-vermillion-500'
              )}
            >
              {pace}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="custom-pace"
            className="text-sm text-ink-400 dark:text-paper-300 whitespace-nowrap"
          >
            Custom:
          </label>
          <input
            id="custom-pace"
            type="number"
            min="0"
            max="999"
            value={customPaceValue}
            onChange={handleCustomPaceChange}
            onFocus={() => setIsCustomPaceMode(true)}
            placeholder="Enter amount..."
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm bg-paper-100 dark:bg-ink-100 border text-ink-100 dark:text-paper-100 focus-ring transition-smooth',
              isCustomPaceMode
                ? 'border-vermillion-500'
                : 'border-paper-300 dark:border-ink-300'
            )}
          />
          <span className="text-sm text-ink-400 dark:text-paper-300 whitespace-nowrap">
            /day
          </span>
        </div>

        {/* Warning for high pace */}
        {lessonsPerDay > 25 && (
          <div className="mt-4 p-3 bg-ochre/10 border border-ochre rounded-lg">
            <p className="text-sm text-ink-100 dark:text-paper-100">
              <span className="font-semibold">High lesson pace:</span> This may
              lead to unsustainable review workload.
            </p>
          </div>
        )}
      </div>

      {/* Time Period Section */}
      <div className="pt-6 border-t border-paper-300 dark:border-ink-300">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
            Time Period
          </h2>
          <InfoTooltip content="How many days into the future to predict. Longer periods are less accurate. 30 days works well for most people." />
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESET_DAYS.map((days) => (
            <button
              key={days}
              onClick={() => handlePresetDaysClick(days)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-smooth focus-ring',
                isDaysPresetActive(days)
                  ? 'bg-vermillion-500 text-white'
                  : 'bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 border border-paper-300 dark:border-ink-300 hover:border-vermillion-500 dark:hover:border-vermillion-500'
              )}
            >
              {days}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="custom-days"
            className="text-sm text-ink-400 dark:text-paper-300 whitespace-nowrap"
          >
            Custom:
          </label>
          <input
            id="custom-days"
            type="number"
            min="7"
            max="180"
            value={customDaysValue}
            onChange={handleCustomDaysChange}
            onFocus={() => setIsCustomDaysMode(true)}
            placeholder="7-180 days..."
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm bg-paper-100 dark:bg-ink-100 border text-ink-100 dark:text-paper-100 focus-ring transition-smooth',
              isCustomDaysMode
                ? 'border-vermillion-500'
                : 'border-paper-300 dark:border-ink-300'
            )}
          />
          <span className="text-sm text-ink-400 dark:text-paper-300 whitespace-nowrap">
            days
          </span>
        </div>
      </div>

      {/* Summary display */}
      <div className="mt-6 pt-4 border-t border-paper-300 dark:border-ink-300">
        <p className="text-sm text-ink-400 dark:text-paper-300">
          Forecasting{' '}
          <span className="text-ink-100 dark:text-paper-100 font-semibold">
            {forecastDays} days
          </span>
          {' '}at{' '}
          <span className="text-ink-100 dark:text-paper-100 font-semibold">
            {lessonsPerDay} lessons/day
          </span>
        </p>
      </div>
    </div>
  )
}
