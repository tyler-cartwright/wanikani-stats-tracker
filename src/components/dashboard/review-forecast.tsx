import { format } from 'date-fns'
import { useSummary } from '@/lib/api/queries'
import { calculateReviewForecast } from '@/lib/calculations/forecasting'

interface ForecastItem {
  time: string
  count: number
  isPeak?: boolean
}

export function ReviewForecast() {
  const { data: summary, isLoading } = useSummary()

  const forecast = summary ? calculateReviewForecast(summary) : null

  const forecastItems: ForecastItem[] = forecast
    ? [
        { time: 'Now', count: forecast.current },
        { time: '+2h', count: forecast.next2h - forecast.current },
        { time: '+6h', count: forecast.next6h - forecast.next2h },
        { time: '+12h', count: forecast.next12h - forecast.next6h },
      ]
    : []

  const maxCount = Math.max(...forecastItems.map((f) => f.count), 1)

  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!forecast) {
    return null
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-8">
        Next 24 Hours
      </h2>

      <div className="space-y-5">
        {forecastItems.map((item) => (
          <div
            key={item.time}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-ink-400 dark:text-paper-300 font-medium w-16 tabular-nums">{item.time}</span>
            <div className="flex-1 mx-6">
              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vermillion-500 rounded-full transition-all duration-slow ease-out"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-ink-100 dark:text-paper-100 font-semibold w-24 text-right tabular-nums">
              {item.count} {item.time === 'Now' ? 'reviews' : 'more'}
            </span>
          </div>
        ))}

        <div className="pt-6 border-t border-paper-300 dark:border-ink-300">
          <p className="text-sm text-ink-400 dark:text-paper-300">
            Peak: <span className="text-ink-100 dark:text-paper-100 font-medium">{format(forecast.peak.time, 'h:mm a')}</span>{' '}
            <span className="text-vermillion-500 font-semibold">({forecast.peak.count} reviews)</span>
          </p>
        </div>
      </div>
    </div>
  )
}
