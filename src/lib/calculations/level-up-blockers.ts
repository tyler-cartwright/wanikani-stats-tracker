// Level-up blockers
//
// Answers "what stands between me and the next level, and when is the
// earliest I could level up?" WaniKani levels you up once 90% of the
// level's kanji reach Guru I; the count of kanji still needed comes from
// calculateLevelProgress so the two can never disagree. For each
// not-yet-Guru kanji we walk the remaining SRS intervals to its earliest
// possible Guru date, assuming every review is answered correctly the
// moment it becomes available (standard SRS timings).
import type { Assignment, ReviewStatistic, Subject } from '@/lib/api/types'
import { SRS_INTERVALS_HOURS } from './srs-intervals'
import { calculateLevelProgress, isKanjiSubject, isRadicalSubject } from './level-progress'
import { extractReadings } from './leeches'
import type { LeechItem } from './leeches'

const HOUR_MS = 60 * 60 * 1000

export interface LevelUpBlocker {
  subjectId: number
  character: string
  meaning: string
  srsStage: number // 0 when there is no usable assignment yet
  availableAt: string | null
  earliestGuruAt: Date
  // No assignment, never unlocked, or assignment hidden — Guru is gated on
  // the component radicals reaching Guru first
  isLocked: boolean
  // Among the N fastest items, where N is the number still needed — these
  // are the ones actually gating the level-up date
  isCritical: boolean
}

export interface LevelUpBlockersResult {
  kanjiNeeded: number // from calculateLevelProgress, verbatim
  kanjiPassed: number
  kanjiTotal: number
  earliestLevelUpAt: Date | null // null when the requirement is already met
  // Every not-yet-Guru kanji of the level, earliest Guru date first
  blockers: LevelUpBlocker[]
}

interface WalkContext {
  now: Date
  assignmentMap: Map<number, Assignment>
  subjectMap: Map<number, Subject & { id: number }>
  memo: Map<number, Date>
}

/**
 * Earliest possible Guru date starting from `stage` (1-4) with the next
 * review happening at `firstReviewAt`: each correct answer advances one
 * stage, each new stage waits its full interval before the next review.
 */
function walkToGuru(stage: number, firstReviewAt: Date): Date {
  let t = firstReviewAt.getTime()
  let s = stage
  for (;;) {
    s += 1 // correct answer taken at time t
    if (s >= 5) return new Date(t)
    t += SRS_INTERVALS_HOURS[s] * HOUR_MS
  }
}

/** Lesson taken at `lessonAt` puts the item at stage 1, first review 4h later. */
function walkFromLesson(lessonAt: Date): Date {
  return walkToGuru(1, new Date(lessonAt.getTime() + SRS_INTERVALS_HOURS[1] * HOUR_MS))
}

/**
 * Earliest possible Guru date for a subject (kanji or radical). Locked kanji
 * recurse into their component radicals: the kanji unlocks when the last
 * radical hits Guru, then starts from its own lesson.
 */
function earliestGuruAt(subjectId: number, ctx: WalkContext): Date {
  const memoized = ctx.memo.get(subjectId)
  if (memoized) return memoized

  const assignment = ctx.assignmentMap.get(subjectId)
  const active = assignment && !assignment.hidden ? assignment : undefined

  let result: Date
  if (active && active.srs_stage >= 5) {
    result = ctx.now
  } else if (active && active.unlocked_at !== null) {
    if (active.started_at !== null && active.srs_stage >= 1) {
      // available_at null on a started item means vacation mode: the review
      // fires the moment vacation ends, so "earliest possible" is now
      const available = active.available_at ? new Date(active.available_at) : ctx.now
      const firstReview = available.getTime() > ctx.now.getTime() ? available : ctx.now
      result = walkToGuru(active.srs_stage, firstReview)
    } else {
      // Unlocked with the lesson still pending
      result = walkFromLesson(ctx.now)
    }
  } else {
    // Locked: gated on every component radical reaching Guru
    const subject = ctx.subjectMap.get(subjectId)
    let unlockMs = ctx.now.getTime()
    if (subject && 'component_subject_ids' in subject) {
      for (const componentId of subject.component_subject_ids) {
        const component = ctx.subjectMap.get(componentId)
        if (!component || !isRadicalSubject(component)) continue
        const componentGuru = earliestGuruAt(componentId, ctx).getTime()
        if (componentGuru > unlockMs) unlockMs = componentGuru
      }
    }
    result = walkFromLesson(new Date(unlockMs))
  }

  ctx.memo.set(subjectId, result)
  return result
}

export function calculateLevelUpBlockers(
  assignments: Assignment[],
  subjects: Array<Subject & { id: number }>,
  userLevel: number,
  now: Date = new Date()
): LevelUpBlockersResult {
  const progress = calculateLevelProgress(assignments, subjects, userLevel, userLevel)

  const assignmentMap = new Map<number, Assignment>()
  for (const assignment of assignments) {
    assignmentMap.set(assignment.subject_id, assignment)
  }
  const subjectMap = new Map<number, Subject & { id: number }>()
  for (const subject of subjects) {
    subjectMap.set(subject.id, subject)
  }
  const ctx: WalkContext = { now, assignmentMap, subjectMap, memo: new Map() }

  const blockers: LevelUpBlocker[] = []
  for (const subject of subjects) {
    if (subject.level !== userLevel) continue
    if (subject.hidden_at !== null) continue
    if (!isKanjiSubject(subject)) continue

    const assignment = assignmentMap.get(subject.id)
    const active = assignment && !assignment.hidden ? assignment : undefined
    if (active && active.srs_stage >= 5) continue // already passed

    const primaryMeaning = subject.meanings.find((m) => m.primary)
    blockers.push({
      subjectId: subject.id,
      character: subject.characters,
      meaning: primaryMeaning?.meaning ?? subject.meanings[0]?.meaning ?? 'Unknown',
      srsStage: active?.srs_stage ?? 0,
      availableAt: active?.available_at ?? null,
      earliestGuruAt: earliestGuruAt(subject.id, ctx),
      isLocked: !active || active.unlocked_at === null,
      isCritical: false,
    })
  }

  blockers.sort((a, b) => a.earliestGuruAt.getTime() - b.earliestGuruAt.getTime())

  const kanjiNeeded = progress.kanjiNeededToLevelUp
  for (let i = 0; i < Math.min(kanjiNeeded, blockers.length); i++) {
    blockers[i].isCritical = true
  }

  const earliestLevelUpAt =
    kanjiNeeded > 0 && blockers.length >= kanjiNeeded
      ? blockers[kanjiNeeded - 1].earliestGuruAt
      : null

  return {
    kanjiNeeded,
    kanjiPassed: progress.kanji.guru,
    kanjiTotal: progress.kanji.total,
    earliestLevelUpAt,
    blockers,
  }
}

/**
 * Enrich a blocker with full subject details for the drill-down modal.
 * Returns a LeechItem-compatible object (same shape ItemDetailContent
 * expects). Unlike enrichStreakItem, tolerates a missing review statistic
 * and assignment — locked and lesson-pending kanji have neither.
 */
export function enrichBlockerItem(
  blocker: LevelUpBlocker,
  subjects: Array<Subject & { id: number }>,
  reviewStats: ReviewStatistic[],
  assignments: Assignment[]
): LeechItem | null {
  const subject = subjects.find((s) => s.id === blocker.subjectId)
  if (!subject) return null

  const stat = reviewStats.find((s) => s.subject_id === blocker.subjectId)
  const assignment = assignments.find((a) => a.subject_id === blocker.subjectId)

  const meaningCorrect = stat?.meaning_correct ?? 0
  const meaningIncorrect = stat?.meaning_incorrect ?? 0
  const readingCorrect = stat?.reading_correct ?? 0
  const readingIncorrect = stat?.reading_incorrect ?? 0
  const meaningTotal = meaningCorrect + meaningIncorrect
  const readingTotal = readingCorrect + readingIncorrect

  const meaningAccuracy =
    meaningTotal > 0 ? parseFloat(((meaningCorrect / meaningTotal) * 100).toFixed(2)) : 100
  const readingAccuracy =
    readingTotal > 0 ? parseFloat(((readingCorrect / readingTotal) * 100).toFixed(2)) : 100

  const allMeanings = subject.meanings.filter((m) => m.accepted_answer).map((m) => m.meaning)
  const character = 'characters' in subject && subject.characters ? subject.characters : '?'

  return {
    subjectId: blocker.subjectId,
    character,
    meaning: blocker.meaning,
    type: 'kanji',
    level: subject.level,
    accuracy: stat?.percentage_correct ?? 100,
    totalReviews: meaningTotal + readingTotal,
    incorrectCount: meaningIncorrect + readingIncorrect,
    severity: 0, // Not used for blockers, but required by LeechItem type
    meaningAccuracy,
    readingAccuracy,
    currentSRS: assignment?.srs_stage ?? 0,
    readings: extractReadings(subject),
    allMeanings,
    documentUrl: subject.document_url,
  }
}
