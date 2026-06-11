// Pure builders that resolve app data into ShareCardData. No canvas, no DOM —
// fully testable in the node test environment.
import type { Assignment, LevelProgression } from '@/lib/api/types'
import type { ActivityDayRow } from '@/lib/db/schema'
import type { Milestone } from '@/lib/calculations/milestones'
import { calculateDailyStreaks } from '@/lib/calculations/daily-streaks'
import { filterToYear, summarizeActivity } from '@/lib/calculations/activity-summary'
import { formatLocalDate } from '@/lib/calculations/activity-capture'
import type {
  LevelUpCardData,
  MilestoneCardData,
  ShareCardIcon,
  YearInReviewCardData,
} from './types'

const MS_PER_DAY = 86_400_000

// Most recent progression for a level (resets can leave several)
function latestProgressionFor(
  levelProgressions: LevelProgression[],
  level: number
): LevelProgression | undefined {
  return levelProgressions
    .filter((p) => p.level === level)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

// A level is *reached* when its progression begins — passed_at means the level
// was completed, which is the next level-up, not this one.
function reachedAt(progression: LevelProgression | undefined): string | null {
  if (!progression) return null
  return progression.started_at ?? progression.unlocked_at ?? progression.created_at
}

export function buildLevelUpCardData(
  username: string,
  level: number,
  levelProgressions: LevelProgression[],
  assignments: Assignment[]
): LevelUpCardData {
  const previous = latestProgressionFor(levelProgressions, level - 1)
  const previousStart = reachedAt(previous)
  const daysOnPreviousLevel =
    previous?.passed_at && previousStart
      ? Math.max(
          1,
          Math.round(
            (new Date(previous.passed_at).getTime() - new Date(previousStart).getTime()) /
              MS_PER_DAY
          )
        )
      : null

  return {
    kind: 'level-up',
    username,
    level,
    reachedAt: reachedAt(latestProgressionFor(levelProgressions, level)),
    stats: {
      itemsPassed: assignments.filter((a) => a.passed_at && !a.hidden).length,
      itemsBurned: assignments.filter((a) => a.burned_at && !a.hidden).length,
      daysOnPreviousLevel,
    },
  }
}

const ICON_BY_NAME: Record<string, ShareCardIcon> = {
  Flame: 'flame',
  Star: 'star',
  Trophy: 'trophy',
}

export function buildMilestoneCardData(
  username: string,
  milestone: Milestone
): MilestoneCardData {
  return {
    kind: 'milestone',
    username,
    label: milestone.label,
    description: milestone.description,
    icon: ICON_BY_NAME[milestone.icon] ?? 'trophy',
    achievedAt: milestone.achievedAt ? milestone.achievedAt.toISOString() : null,
  }
}

export function buildYearInReviewCardData(
  username: string,
  year: number,
  history: ActivityDayRow[],
  achievedMilestones: Milestone[]
): YearInReviewCardData {
  const yearHistory = filterToYear(history, year)
  const summary = summarizeActivity(yearHistory)
  // Within a single year today-grace is irrelevant; only `longest` is used
  const streaks = calculateDailyStreaks(yearHistory, formatLocalDate(new Date()))

  const milestones = achievedMilestones
    .filter((m) => m.achievedAt && m.achievedAt.getFullYear() === year)
    .sort((a, b) => b.achievedAt!.getTime() - a.achievedAt!.getTime())
    .slice(0, 3)
    .map((m) => m.label)

  // Caveat only when capture began partway through this year — a history that
  // starts in an earlier year covered this one fully
  const overallFirst = summarizeActivity(history).firstDate
  const trackedFrom =
    overallFirst && overallFirst.startsWith(`${year}-`) && !overallFirst.endsWith('-01-01')
      ? overallFirst
      : null

  return {
    kind: 'year-review',
    username,
    year,
    totalReviews: summary.totalReviews,
    totalLessons: summary.totalLessons,
    activeDays: summary.activeDays,
    longestStreak: streaks.longest,
    busiestDay: summary.busiestDay
      ? { date: summary.busiestDay.date, total: summary.busiestDay.total }
      : null,
    milestones,
    trackedFrom,
  }
}
