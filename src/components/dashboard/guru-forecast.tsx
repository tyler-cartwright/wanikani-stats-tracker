import { useMemo } from 'react'
import { useAssignments } from '@/lib/api/queries'
import { startOfDay, endOfDay, addDays, formatDistanceToNow } from 'date-fns'
import { useSyncStore } from '@/stores/sync-store'

interface TimeBreakdown {
  label: string
  count: number
  availableAt: Date | null
}

export function GuruForecast() {
  const { data: assignments, isLoading } = useAssignments()
  const isSyncing = useSyncStore((state) => state.isSyncing)

  const { today, tomorrow, todayBreakdown } = useMemo(() => {
    if (!assignments) return { today: 0, tomorrow: 0, todayBreakdown: [] }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const tomorrowStart = startOfDay(addDays(now, 1))
    const tomorrowEnd = endOfDay(addDays(now, 1))

    let todayCount = 0
    let tomorrowCount = 0
    const todayItems: Date[] = []

    // Count items at Apprentice IV (stage 4) that have reviews available
    // These will advance to Guru I (stage 5) if answered correctly
    assignments.forEach((assignment) => {
      if (assignment.srs_stage !== 4) return // Only Apprentice IV
      if (!assignment.available_at) return

      const availableAt = new Date(assignment.available_at)

      // Check if review is available today
      if (availableAt >= todayStart && availableAt <= todayEnd) {
        todayCount++
        todayItems.push(availableAt)
      }
      // Check if review is available tomorrow
      else if (availableAt >= tomorrowStart && availableAt <= tomorrowEnd) {
        tomorrowCount++
      }
    })

    // Create breakdown for today
    const breakdown: TimeBreakdown[] = []
    if (todayItems.length > 0) {
      // Sort items by time
      todayItems.sort((a, b) => a.getTime() - b.getTime())

      // Count items available now
      const nowItems = todayItems.filter((t) => t <= now)
      if (nowItems.length > 0) {
        breakdown.push({
          label: 'Now',
          count: nowItems.length,
          availableAt: null,
        })
      }

      // Get remaining items
      const futureItems = todayItems.filter((t) => t > now)

      if (futureItems.length > 0) {
        // Group by unique timestamps
        const timeGroups = new Map<number, number>()
        futureItems.forEach((time) => {
          const timestamp = time.getTime()
          timeGroups.set(timestamp, (timeGroups.get(timestamp) || 0) + 1)
        })

        const uniqueTimes = Array.from(timeGroups.entries())
          .sort((a, b) => a[0] - b[0])

        // Show the next batch with specific time
        if (uniqueTimes.length > 0) {
          const [nextTimestamp, nextCount] = uniqueTimes[0]
          const nextTime = new Date(nextTimestamp)
          const distance = formatDistanceToNow(nextTime, { addSuffix: false })

          breakdown.push({
            label: `In ${distance}`,
            count: nextCount,
            availableAt: nextTime,
          })

          // Group remaining as "later" if there are more batches
          const laterCount = futureItems.length - nextCount
          if (laterCount > 0) {
            breakdown.push({
              label: 'Later',
              count: laterCount,
              availableAt: null,
            })
          }
        }
      }
    }

    return { today: todayCount, tomorrow: tomorrowCount, todayBreakdown: breakdown }
  }, [assignments])

  const total = today + tomorrow
  const maxCount = Math.max(today, tomorrow, 1)

  if (isLoading || isSyncing) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
        <div className="h-6 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-8" />
        <div className="space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-4 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
      <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-8">
        Guru Forecast
      </h2>

      <div className="space-y-5">
        {/* Today */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-400 dark:text-paper-300 font-medium w-20 tabular-nums">
              Today
            </span>
            <div className="flex-1 mx-6">
              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-patina-500 dark:bg-patina-400 rounded-full transition-all duration-slow ease-out"
                  style={{ width: `${(today / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-ink-100 dark:text-paper-100 font-semibold w-24 text-right tabular-nums">
              {today} items
            </span>
          </div>

          {/* Today Breakdown */}
          {todayBreakdown.length > 0 && (
            <div className="mt-3 ml-6 space-y-2">
              {todayBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-ink-400 dark:text-paper-300 w-24 tabular-nums">
                    {item.label}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="h-1.5 bg-paper-300/50 dark:bg-ink-300/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-patina-500/50 dark:bg-patina-400/50 rounded-full transition-all duration-slow ease-out"
                        style={{ width: `${(item.count / today) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-ink-400 dark:text-paper-300 w-16 text-right tabular-nums">
                    {item.count} {item.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tomorrow */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400 dark:text-paper-300 font-medium w-20 tabular-nums">
            Tomorrow
          </span>
          <div className="flex-1 mx-6">
            <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-patina-500 dark:bg-patina-400 rounded-full transition-all duration-slow ease-out"
                style={{ width: `${(tomorrow / maxCount) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-ink-100 dark:text-paper-100 font-semibold w-24 text-right tabular-nums">
            {tomorrow} items
          </span>
        </div>

        {/* Total */}
        <div className="pt-6 border-t border-paper-300 dark:border-ink-300">
          <p className="text-sm text-ink-400 dark:text-paper-300">
            Total: <span className="text-ink-100 dark:text-paper-100 font-medium">{total} items</span>{' '}
            <span className="text-patina-500 dark:text-patina-400 font-semibold">leaving Apprentice IV</span>
          </p>
        </div>
      </div>
    </div>
  )
}
