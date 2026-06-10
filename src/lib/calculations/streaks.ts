// Streaks & personal records
//
// Surfaces the per-item streak counters WaniKani already syncs in
// review_statistics (meaning/reading current and max streaks). Meaning and
// reading are tracked as separate entries: an item can be rock-solid on
// meaning while its reading keeps breaking.
import type { Assignment, ReviewStatistic, Subject } from '@/lib/api/types'
import { extractReadings } from './leeches'
import type { LeechItem } from './leeches'

export interface ItemStreak {
  subjectId: number
  facet: 'meaning' | 'reading'
  currentStreak: number
  maxStreak: number
}

export interface StreakRecords {
  // The single highest max streak across all items and facets
  longestEver: ItemStreak | null
  // Facets currently on a streak of hotThreshold or more, longest first
  hotStreaks: ItemStreak[]
  // Long streaks that just broke (current <= 1 after a max of brokenMinMax+),
  // biggest loss first — these items are at risk of becoming leeches
  recentlyBroken: ItemStreak[]
  totalOnHotStreak: number
}

export interface StreakOptions {
  hotThreshold?: number
  brokenMinMax?: number
}

export function calculateStreakRecords(
  stats: ReviewStatistic[],
  options: StreakOptions = {}
): StreakRecords {
  const hotThreshold = options.hotThreshold ?? 20
  const brokenMinMax = options.brokenMinMax ?? 10

  const entries: ItemStreak[] = []

  for (const stat of stats) {
    if (stat.hidden) continue

    // A facet only participates once it has answers — radicals have no
    // reading facet and would otherwise pollute the records with zeros
    if (stat.meaning_correct + stat.meaning_incorrect > 0) {
      entries.push({
        subjectId: stat.subject_id,
        facet: 'meaning',
        currentStreak: stat.meaning_current_streak,
        maxStreak: stat.meaning_max_streak,
      })
    }
    if (stat.reading_correct + stat.reading_incorrect > 0) {
      entries.push({
        subjectId: stat.subject_id,
        facet: 'reading',
        currentStreak: stat.reading_current_streak,
        maxStreak: stat.reading_max_streak,
      })
    }
  }

  let longestEver: ItemStreak | null = null
  const hotStreaks: ItemStreak[] = []
  const recentlyBroken: ItemStreak[] = []

  for (const entry of entries) {
    if (!longestEver || entry.maxStreak > longestEver.maxStreak) {
      longestEver = entry
    }
    if (entry.currentStreak >= hotThreshold) {
      hotStreaks.push(entry)
    }
    if (entry.currentStreak <= 1 && entry.maxStreak >= brokenMinMax) {
      recentlyBroken.push(entry)
    }
  }

  hotStreaks.sort((a, b) => b.currentStreak - a.currentStreak)
  recentlyBroken.sort((a, b) => b.maxStreak - a.maxStreak)

  return {
    longestEver,
    hotStreaks,
    recentlyBroken,
    totalOnHotStreak: hotStreaks.length,
  }
}

/**
 * Enrich a streak entry with full subject details for the drill-down modal.
 * Returns a LeechItem-compatible object (same shape ItemDetailContent expects).
 */
export function enrichStreakItem(
  item: ItemStreak,
  subjects: Array<Subject & { id: number }>,
  reviewStats: ReviewStatistic[],
  assignments: Assignment[]
): LeechItem | null {
  const subject = subjects.find((s) => s.id === item.subjectId)
  if (!subject) return null

  const stat = reviewStats.find((s) => s.subject_id === item.subjectId)
  if (!stat) return null

  const assignment = assignments.find((a) => a.subject_id === item.subjectId)

  const meaningTotal = stat.meaning_correct + stat.meaning_incorrect
  const readingTotal = stat.reading_correct + stat.reading_incorrect
  const totalReviews = meaningTotal + readingTotal
  const incorrectCount = stat.meaning_incorrect + stat.reading_incorrect

  const meaningAccuracy =
    meaningTotal > 0 ? parseFloat(((stat.meaning_correct / meaningTotal) * 100).toFixed(2)) : 100
  const readingAccuracy =
    readingTotal > 0 ? parseFloat(((stat.reading_correct / readingTotal) * 100).toFixed(2)) : 100

  const primaryMeaning = subject.meanings.find((m) => m.primary)
  const meaning = primaryMeaning?.meaning ?? subject.meanings[0]?.meaning ?? 'Unknown'
  const allMeanings = subject.meanings.filter((m) => m.accepted_answer).map((m) => m.meaning)

  const character = 'characters' in subject && subject.characters ? subject.characters : '?'
  const type = stat.subject_type === 'kana_vocabulary' ? 'vocabulary' : stat.subject_type

  return {
    subjectId: item.subjectId,
    character,
    meaning,
    type: type as 'radical' | 'kanji' | 'vocabulary',
    level: subject.level,
    accuracy: stat.percentage_correct,
    totalReviews,
    incorrectCount,
    severity: 0, // Not used for streak items, but required by LeechItem type
    meaningAccuracy,
    readingAccuracy,
    currentSRS: assignment?.srs_stage ?? 0,
    readings: extractReadings(subject),
    allMeanings,
    documentUrl: subject.document_url,
  }
}
