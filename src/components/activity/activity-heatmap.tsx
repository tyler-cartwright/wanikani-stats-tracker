import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import type { ActivityDayRow } from '@/lib/db/schema'
import { formatLocalDate, parseLocalDate } from '@/lib/calculations/activity-capture'
import { listAvailableYears, summarizeActivity } from '@/lib/calculations/activity-summary'
import { buildHeatmapGrid, type HeatmapCell } from '@/lib/calculations/heatmap-grid'

// One week column is a 12px cell plus a 3px gap — month labels position by it
const WEEK_STRIDE_PX = 15
// The w-8 weekday label column plus its 3px gap, left of the first week
const WEEKDAY_LABEL_PX = 35

const LEVEL_CLASSES = [
  'bg-paper-300 dark:bg-ink-300',
  'bg-patina-500/25 dark:bg-patina-400/25',
  'bg-patina-500/50 dark:bg-patina-400/50',
  'bg-patina-500/75 dark:bg-patina-400/75',
  'bg-patina-600 dark:bg-patina-400',
]

function cellTitle(cell: HeatmapCell, firstDate: string | null): string {
  const dateLabel = format(parseLocalDate(cell.date), 'MMM d, yyyy')
  if (cell.isFuture) return dateLabel
  if (!cell.hasRow && firstDate && cell.date < firstDate) {
    return `${dateLabel} — not yet tracked`
  }
  const counts = `${cell.reviews.toLocaleString()} reviews · ${cell.lessons.toLocaleString()} lessons`
  if (cell.baseline) {
    return `${dateLabel} — ${counts}\nPartial day: tracking started or restarted here`
  }
  return `${dateLabel} — ${counts}`
}

export function ActivityHeatmap({ history }: { history: ActivityDayRow[] }) {
  const years = useMemo(() => listAvailableYears(history), [history])
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(years[0] ?? currentYear)

  const today = formatLocalDate(new Date())
  const grid = useMemo(
    () => buildHeatmapGrid(history, selectedYear, today),
    [history, selectedYear, today]
  )
  const summary = useMemo(() => summarizeActivity(history), [history])

  // On narrow screens the grid overflows; opening at scrollLeft 0 shows
  // January — months of empty cells for anyone who started tracking
  // mid-year. Anchor the right edge at today's week instead (last week for
  // past years), GitHub-style: recent activity visible, history a scroll
  // away, future stubs off-screen. Clamps to 0 when there's no overflow.
  const scrollRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || grid.weeks.length === 0) return
    const todayWeek = grid.weeks.findIndex((week) => week.some((cell) => cell.date === today))
    const targetWeek = todayWeek >= 0 ? todayWeek : grid.weeks.length - 1
    el.scrollLeft = Math.max(
      0,
      WEEKDAY_LABEL_PX + (targetWeek + 1) * WEEK_STRIDE_PX - el.clientWidth
    )
  }, [grid, today])

  // The selected year is partially tracked when capture began mid-year
  const trackingNote =
    summary.firstDate && summary.firstDate.startsWith(`${selectedYear}-`) &&
    !summary.firstDate.endsWith('-01-01')
      ? `Tracking since ${format(parseLocalDate(summary.firstDate), 'MMM d, yyyy')}`
      : null

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
      {/* Header with year selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Review Activity
        </h2>
        {years.length > 1 && (
          <div className="flex gap-1 bg-paper-300 dark:bg-ink-300 rounded-lg p-1">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-smooth',
                  year === selectedYear
                    ? 'bg-paper-200 dark:bg-ink-200 text-ink-100 dark:text-paper-100 font-medium shadow-sm'
                    : 'text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100'
                )}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="min-w-max">
          {/* Month labels, positioned over their first week column */}
          <div className="relative h-4 ml-8 text-xs text-ink-400 dark:text-paper-300">
            {grid.monthLabels.map(({ weekIndex, label }) => (
              <span
                key={label}
                className="absolute top-0"
                style={{ left: weekIndex * WEEK_STRIDE_PX }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday labels */}
            <div className="flex flex-col gap-[3px] w-8 flex-shrink-0 text-[10px] text-ink-400 dark:text-paper-300">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                <div key={i} className="h-3 leading-3">
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {grid.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    title={cell.inYear ? cellTitle(cell, summary.firstDate) : undefined}
                    className={cn(
                      'w-3 h-3 rounded-sm',
                      !cell.inYear && 'invisible',
                      cell.isFuture
                        ? 'bg-paper-300/40 dark:bg-ink-300/40'
                        : LEVEL_CLASSES[cell.level],
                      cell.baseline && 'ring-1 ring-inset ring-vermillion-400'
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-ink-400 dark:text-paper-300">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-sm', cls)} />
          ))}
          <span>More</span>
        </div>
        {summary.hasBaselineDays && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-paper-300 dark:bg-ink-300 ring-1 ring-inset ring-vermillion-400" />
            <span>Partial day (tracking started or restarted)</span>
          </div>
        )}
        {trackingNote && <span>{trackingNote}</span>}
      </div>
    </div>
  )
}
