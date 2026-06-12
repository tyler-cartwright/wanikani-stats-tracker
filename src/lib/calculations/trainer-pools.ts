// Trainer pool selection: builds the deck of cards a self-study session
// quizzes over. Pure functions — all data and clocks are injected.
import type { Assignment, ReviewStatistic, Subject } from '@/lib/api/types'
import {
  detectLeeches,
  extractReadings,
  findConfusionPairs,
  type LeechItem,
  type LeechReadings,
} from './leeches'

export type TrainerPoolId = 'leeches' | 'recently-failed' | 'current-level'
export type TrainerMode = 'flashcards' | 'confusion'

export interface TrainerCard {
  subjectId: number
  character: string
  type: 'radical' | 'kanji' | 'vocabulary'
  level: number
  primaryMeaning: string
  allMeanings: string[] // accepted answers only
  readings: LeechReadings // empty for radicals
  audioUrl: string | null // vocabulary only
  documentUrl: string
  // Stats for the results drilldown; zeros when never reviewed
  currentSRS: number
  accuracy: number
  meaningAccuracy: number
  readingAccuracy: number
  totalReviews: number
  incorrectCount: number
  // Confusion mode: the visually-similar sibling shown on reveal. Carries
  // display data (not just an id) so retry decks stay self-contained even
  // when the sibling card isn't in them.
  contrast?: {
    subjectId: number
    character: string
    meaning: string
    reading: string | null
  }
}

export const RECENTLY_FAILED_WINDOW_DAYS = 7

/**
 * Best playable pronunciation for a subject. Vocabulary only; prefers
 * audio/mpeg (broadest <audio> support), falls back to the first entry.
 */
export function pickAudioUrl(subject: Subject): string | null {
  if (!('pronunciation_audios' in subject)) return null
  const audios = subject.pronunciation_audios
  if (audios.length === 0) return null
  const mpeg = audios.find((a) => a.content_type === 'audio/mpeg')
  return (mpeg ?? audios[0]).url
}

function subjectType(subject: Subject): TrainerCard['type'] {
  if ('character_images' in subject) return 'radical'
  if ('visually_similar_subject_ids' in subject) return 'kanji'
  return 'vocabulary'
}

function facetAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect
  return total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 100
}

function buildCard(
  subject: Subject & { id: number },
  assignment: Assignment | undefined,
  stat: ReviewStatistic | undefined
): TrainerCard {
  const totalReviews = stat
    ? stat.meaning_correct + stat.meaning_incorrect + stat.reading_correct + stat.reading_incorrect
    : 0

  return {
    subjectId: subject.id,
    character: ('characters' in subject ? subject.characters : null) || '?',
    type: subjectType(subject),
    level: subject.level,
    primaryMeaning: subject.meanings.find((m) => m.primary)?.meaning ?? 'Unknown',
    allMeanings: subject.meanings.filter((m) => m.accepted_answer).map((m) => m.meaning),
    readings: extractReadings(subject),
    audioUrl: pickAudioUrl(subject),
    documentUrl: subject.document_url,
    currentSRS: assignment?.srs_stage ?? 0,
    accuracy: stat?.percentage_correct ?? 0,
    meaningAccuracy: stat ? facetAccuracy(stat.meaning_correct, stat.meaning_incorrect) : 0,
    readingAccuracy: stat ? facetAccuracy(stat.reading_correct, stat.reading_incorrect) : 0,
    totalReviews,
    incorrectCount: stat ? stat.meaning_incorrect + stat.reading_incorrect : 0,
  }
}

function leechToCard(leech: LeechItem, subjectMap: Map<number, Subject & { id: number }>): TrainerCard {
  const subject = subjectMap.get(leech.subjectId)
  return {
    subjectId: leech.subjectId,
    character: leech.character,
    type: leech.type,
    level: leech.level,
    primaryMeaning: leech.meaning,
    allMeanings: leech.allMeanings,
    readings: leech.readings,
    audioUrl: subject ? pickAudioUrl(subject) : null,
    documentUrl: leech.documentUrl,
    currentSRS: leech.currentSRS,
    accuracy: leech.accuracy,
    meaningAccuracy: leech.meaningAccuracy,
    readingAccuracy: leech.readingAccuracy,
    totalReviews: leech.totalReviews,
    incorrectCount: leech.incorrectCount,
  }
}

/**
 * Adapts a TrainerCard back to the LeechItem shape ItemDetailContent renders.
 * severity is a fill — non-leech pools have no meaningful severity score.
 */
export function toDetailItem(card: TrainerCard): LeechItem {
  return {
    subjectId: card.subjectId,
    character: card.character,
    meaning: card.primaryMeaning,
    type: card.type,
    level: card.level,
    accuracy: card.accuracy,
    totalReviews: card.totalReviews,
    incorrectCount: card.incorrectCount,
    severity: 0,
    meaningAccuracy: card.meaningAccuracy,
    readingAccuracy: card.readingAccuracy,
    currentSRS: card.currentSRS,
    readings: card.readings,
    allMeanings: card.allMeanings,
    documentUrl: card.documentUrl,
  }
}

function makeSubjectMap(subjects: (Subject & { id: number })[]): Map<number, Subject & { id: number }> {
  return new Map(subjects.map((s) => [s.id, s]))
}

/** The Leeches page's detection verbatim, as trainer cards (severity order). */
export function buildLeechPool(
  reviewStats: ReviewStatistic[],
  subjects: (Subject & { id: number })[],
  assignments: Assignment[],
  opts: { includeBurned?: boolean } = {}
): TrainerCard[] {
  const subjectMap = makeSubjectMap(subjects)
  const leeches = detectLeeches(reviewStats, subjects, assignments, {
    includeBurned: opts.includeBurned,
  })
  return leeches.map((leech) => leechToCard(leech, subjectMap))
}

// A cached review-statistic row with its local write time — the only per-item
// freshness signal available (the API's per-resource data_updated_at is not
// persisted, and GET /reviews is gone).
export interface StatRow {
  stat: ReviewStatistic
  updatedAt: string
}

/**
 * Items whose most recent review likely contained a miss.
 *
 * A facet (meaning/reading) counts as recently failed when it has been
 * reviewed at all, has at least one recorded miss, and its current streak is
 * <= 1 — WaniKani zeroes the streak on a wrong answer, so a streak of 0 or 1
 * means the last answer was wrong or it has recovered exactly one correct.
 * The reviewed-at-all guard keeps radicals' empty reading facet from
 * auto-qualifying; the miss guard keeps new items whose only review was
 * correct out.
 *
 * Recency comes from the cached row's local write time: review stats only
 * change when a review happens, so a delta-sync write inside the window is an
 * honest proxy. Caveat: a force full sync stamps every row at once,
 * temporarily widening the window to "any low-streak item with a miss" until
 * delta syncs resume — bounded, and self-correcting.
 */
export function buildRecentlyFailedPool(
  statRows: StatRow[],
  subjects: (Subject & { id: number })[],
  assignments: Assignment[],
  opts: { days?: number; now?: Date } = {}
): TrainerCard[] {
  const days = opts.days ?? RECENTLY_FAILED_WINDOW_DAYS
  const now = opts.now ?? new Date()
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000

  const subjectMap = makeSubjectMap(subjects)
  const assignmentMap = new Map(assignments.map((a) => [a.subject_id, a]))

  const cards: Array<{ card: TrainerCard; updatedAt: string }> = []

  for (const { stat, updatedAt } of statRows) {
    if (stat.hidden) continue
    if (new Date(updatedAt).getTime() < cutoff) continue

    const facetFailed = (correct: number, incorrect: number, streak: number) =>
      correct + incorrect > 0 && incorrect > 0 && streak <= 1
    const meaningFailed = facetFailed(
      stat.meaning_correct,
      stat.meaning_incorrect,
      stat.meaning_current_streak
    )
    const readingFailed = facetFailed(
      stat.reading_correct,
      stat.reading_incorrect,
      stat.reading_current_streak
    )
    if (!meaningFailed && !readingFailed) continue

    const subject = subjectMap.get(stat.subject_id)
    if (!subject || subject.hidden_at !== null) continue

    const assignment = assignmentMap.get(stat.subject_id)
    if (!assignment || !assignment.started_at || assignment.hidden) continue
    if (assignment.srs_stage === 9) continue // burned: no longer in rotation

    cards.push({ card: buildCard(subject, assignment, stat), updatedAt })
  }

  // Most recently updated first; the quiz shuffles anyway
  return cards
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((entry) => entry.card)
}

/**
 * Every started, non-hidden item at the user's current level, in lesson
 * order. Items without review stats are included with zeroed stats — brand
 * new items are exactly what this pool is for.
 */
export function buildCurrentLevelPool(
  subjects: (Subject & { id: number })[],
  assignments: Assignment[],
  currentLevel: number,
  reviewStats: ReviewStatistic[] = []
): TrainerCard[] {
  const assignmentMap = new Map(assignments.map((a) => [a.subject_id, a]))
  const statMap = new Map(reviewStats.map((s) => [s.subject_id, s]))

  return subjects
    .filter((subject) => {
      if (subject.level !== currentLevel || subject.hidden_at !== null) return false
      const assignment = assignmentMap.get(subject.id)
      return !!assignment && !!assignment.started_at && !assignment.hidden
    })
    .sort((a, b) => a.lesson_position - b.lesson_position)
    .map((subject) =>
      buildCard(subject, assignmentMap.get(subject.id), statMap.get(subject.id))
    )
}

/**
 * Cards from the Leeches page's confusion pairs, each carrying its
 * visually-similar sibling for the reveal-side contrast panel. An item
 * appearing in several pairs keeps the contrast from its highest-similarity
 * pairing (findConfusionPairs returns pairs sorted by similarity desc).
 */
export function buildConfusionPairPool(
  reviewStats: ReviewStatistic[],
  subjects: (Subject & { id: number })[],
  assignments: Assignment[],
  opts: { includeBurned?: boolean } = {}
): TrainerCard[] {
  const subjectMap = makeSubjectMap(subjects)
  const leeches = detectLeeches(reviewStats, subjects, assignments, {
    includeBurned: opts.includeBurned,
  })
  const pairs = findConfusionPairs(leeches)

  const cards = new Map<number, TrainerCard>()
  for (const pair of pairs) {
    for (const [item, sibling] of [
      [pair.item1, pair.item2],
      [pair.item2, pair.item1],
    ] as const) {
      if (cards.has(item.subjectId)) continue
      cards.set(item.subjectId, {
        ...leechToCard(item, subjectMap),
        contrast: {
          subjectId: sibling.subjectId,
          character: sibling.character,
          meaning: sibling.meaning,
          reading: sibling.readings.primary,
        },
      })
    }
  }

  return Array.from(cards.values())
}
