// Daily study streaks computed from the captured activity history.
//
// An "active day" is one with at least one review answer or lesson — a row
// merely existing is not enough, since every sync writes a row for the SRS
// snapshot even on idle days. Streaks can never extend before the first
// captured row: history is forward-only and we genuinely don't know what
// happened earlier.
import type { ActivityDayRow } from '@/lib/db/schema'
import { formatLocalDate, parseLocalDate } from './activity-capture'

export interface DailyStreaks {
  // Consecutive active days ending today or yesterday. Today-grace: a streak
  // that ran through yesterday is still "current" before today's reviews are
  // done — only a gap before yesterday breaks it.
  current: number
  currentIncludesToday: boolean
  longest: number
  longestStart: string | null // 'YYYY-MM-DD'
  longestEnd: string | null
}

const EMPTY_STREAKS: DailyStreaks = {
  current: 0,
  currentIncludesToday: false,
  longest: 0,
  longestStart: null,
  longestEnd: null,
}

export function isActiveDay(row: ActivityDayRow): boolean {
  const { meaningCorrect, meaningIncorrect, readingCorrect, readingIncorrect } = row.reviews
  return (
    meaningCorrect + meaningIncorrect + readingCorrect + readingIncorrect + row.lessons > 0
  )
}

// Calendar-day distance between two 'YYYY-MM-DD' strings, DST-safe: local
// midnights are at most an hour off a multiple of 24h, so rounding fixes it.
function daysBetween(earlier: string, later: string): number {
  const ms = parseLocalDate(later).getTime() - parseLocalDate(earlier).getTime()
  return Math.round(ms / 86_400_000)
}

function previousDay(date: string): string {
  const d = parseLocalDate(date)
  d.setDate(d.getDate() - 1)
  return formatLocalDate(d)
}

// `today` is injected as a 'YYYY-MM-DD' string for testability; callers pass
// formatLocalDate(new Date()).
export function calculateDailyStreaks(
  history: ActivityDayRow[],
  today: string
): DailyStreaks {
  // The repository returns chronological order, but sort defensively — a
  // wrong streak is worse than a redundant sort. Lexicographic = chronological
  // for this date format.
  const activeDates = history
    .filter(isActiveDay)
    .map((row) => row.date)
    .sort()

  if (activeDates.length === 0) return { ...EMPTY_STREAKS }

  let longest = 0
  let longestStart: string | null = null
  let longestEnd: string | null = null

  let runStart = activeDates[0]
  let runLength = 1

  const closeRun = (runEnd: string) => {
    if (runLength > longest) {
      longest = runLength
      longestStart = runStart
      longestEnd = runEnd
    }
  }

  for (let i = 1; i < activeDates.length; i++) {
    if (daysBetween(activeDates[i - 1], activeDates[i]) === 1) {
      runLength++
    } else {
      closeRun(activeDates[i - 1])
      runStart = activeDates[i]
      runLength = 1
    }
  }
  closeRun(activeDates[activeDates.length - 1])

  // Current streak: the final run, if it reaches today or yesterday
  const lastActive = activeDates[activeDates.length - 1]
  const currentIncludesToday = lastActive === today
  const reachesYesterday = lastActive === previousDay(today)

  return {
    current: currentIncludesToday || reachesYesterday ? runLength : 0,
    currentIncludesToday,
    longest,
    longestStart,
    longestEnd,
  }
}
