import { format } from 'date-fns'
import { CalendarCheck, Flame, GraduationCap, ListChecks, Trophy, Zap } from 'lucide-react'
import { parseLocalDate } from '@/lib/calculations/activity-capture'
import type { DailyStreaks } from '@/lib/calculations/daily-streaks'
import type { ActivitySummary } from '@/lib/calculations/activity-summary'

interface StatTileProps {
  icon: typeof Flame
  label: string
  value: string
  sublabel?: string
}

function StatTile({ icon: Icon, label, value, sublabel }: StatTileProps) {
  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-vermillion-500 dark:text-vermillion-400" />
        <span className="text-sm font-medium text-ink-400 dark:text-paper-300">{label}</span>
      </div>
      <div className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100 leading-tight">
        {value}
      </div>
      {sublabel && (
        <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">{sublabel}</div>
      )}
    </div>
  )
}

interface ActivityStatsProps {
  streaks: DailyStreaks
  summary: ActivitySummary
}

export function ActivityStats({ streaks, summary }: ActivityStatsProps) {
  const dayWord = (n: number) => (n === 1 ? 'day' : 'days')

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatTile
        icon={Flame}
        label="Current Streak"
        value={`${streaks.current} ${dayWord(streaks.current)}`}
        sublabel={
          streaks.current > 0 && !streaks.currentIncludesToday
            ? 'Do reviews today to keep it going'
            : undefined
        }
      />
      <StatTile
        icon={Trophy}
        label="Longest Streak"
        value={`${streaks.longest} ${dayWord(streaks.longest)}`}
        sublabel={
          streaks.longestEnd
            ? `Ended ${format(parseLocalDate(streaks.longestEnd), 'MMM d, yyyy')}`
            : undefined
        }
      />
      <StatTile
        icon={Zap}
        label="Busiest Day"
        value={summary.busiestDay ? summary.busiestDay.total.toLocaleString() : '—'}
        sublabel={
          summary.busiestDay
            ? format(parseLocalDate(summary.busiestDay.date), 'MMM d, yyyy')
            : undefined
        }
      />
      <StatTile
        icon={ListChecks}
        label="Total Reviews"
        value={summary.totalReviews.toLocaleString()}
        sublabel="Answers since tracking began"
      />
      <StatTile
        icon={GraduationCap}
        label="Total Lessons"
        value={summary.totalLessons.toLocaleString()}
      />
      <StatTile
        icon={CalendarCheck}
        label="Active Days"
        value={summary.activeDays.toLocaleString()}
        sublabel={`of ${summary.trackedDays.toLocaleString()} tracked`}
      />
    </div>
  )
}
