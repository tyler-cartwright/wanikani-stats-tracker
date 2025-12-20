// Level Progress Calculations
import type { Assignment, Subject } from '@/lib/api/types'

export interface SubjectProgressData {
  started: number // Items with started_at !== null
  startedPercentage: number
  guru: number // Items with srs_stage >= 5
  guruPercentage: number
  total: number
}

export interface LevelProgressData {
  radicals: SubjectProgressData
  kanji: SubjectProgressData
  vocabulary: SubjectProgressData
  kanjiNeededToLevelUp: number
  daysOnLevel: number
  passedAt?: string | null // For completed levels
  isCurrentLevel: boolean
  averageDaysPerLevel?: number // total average (includes all levels)
  activeDaysPerLevel?: number // active learning average (excludes breaks)
  excludedLevels?: number[] // which levels were filtered out
}

/**
 * Calculate progress for a given level
 *
 * Level up requirement: Pass 90% of kanji for the level (Guru or higher)
 * Tracks both lessons started and items at Guru I or higher (SRS stage >= 5)
 */
export function calculateLevelProgress(
  assignments: Assignment[],
  subjects: (Subject & { id: number })[],
  selectedLevel: number,
  userCurrentLevel: number,
  levelStartDate?: string,
  levelPassedAt?: string | null
): LevelProgressData {
  // Create assignment lookup map
  const assignmentMap = new Map<number, Assignment>()
  assignments.forEach((assignment) => {
    assignmentMap.set(assignment.subject_id, assignment)
  })

  // Count ALL subjects in the selected level (not just unlocked ones)
  let radicalsTotal = 0
  let radicalsStarted = 0
  let radicalsGuruCount = 0
  let kanjiTotal = 0
  let kanjiStarted = 0
  let kanjiGuruCount = 0
  let vocabularyTotal = 0
  let vocabularyStarted = 0
  let vocabularyGuruCount = 0

  for (const subject of subjects) {
    // Skip if not selected level
    if (!('level' in subject) || subject.level !== selectedLevel) continue

    // Skip subjects hidden from curriculum
    // These are items WaniKani removed from the curriculum
    if (subject.hidden_at !== null) continue

    // Get assignment if it exists
    const assignment = assignmentMap.get(subject.id)

    // Count totals based on subject type
    if ('character_images' in subject) {
      // Radical
      radicalsTotal++
      // Count as started if assignment exists, not hidden, and has started_at
      if (assignment && !assignment.hidden && assignment.started_at !== null) {
        radicalsStarted++
      }
      // Count as guru if assignment exists, not hidden, and SRS stage >= 5 (Guru I or higher)
      // Hidden items are excluded from level progression requirements
      if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
        radicalsGuruCount++
      }
    } else if ('component_subject_ids' in subject && 'readings' in subject) {
      // Check if it's kanji (has readings with type property)
      const hasKanjiReadings = subject.readings.some((r: any) => 'type' in r)
      if (hasKanjiReadings) {
        // Kanji
        kanjiTotal++
        if (assignment && !assignment.hidden && assignment.started_at !== null) {
          kanjiStarted++
        }
        if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
          kanjiGuruCount++
        }
      } else {
        // Vocabulary
        vocabularyTotal++
        if (assignment && !assignment.hidden && assignment.started_at !== null) {
          vocabularyStarted++
        }
        if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
          vocabularyGuruCount++
        }
      }
    } else {
      // Kana vocabulary (no component_subject_ids)
      vocabularyTotal++
      if (assignment && !assignment.hidden && assignment.started_at !== null) {
        vocabularyStarted++
      }
      if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
        vocabularyGuruCount++
      }
    }
  }

  // Calculate kanji needed to level up (90% of total kanji)
  const kanjiNeededForLevelUp = Math.ceil(kanjiTotal * 0.9)
  const kanjiNeeded = Math.max(0, kanjiNeededForLevelUp - kanjiGuruCount)

  // Calculate days on level
  let daysOnLevel = 0
  if (levelStartDate) {
    const startDate = new Date(levelStartDate)
    const endDate = levelPassedAt ? new Date(levelPassedAt) : new Date()
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    daysOnLevel = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return {
    radicals: {
      started: radicalsStarted,
      startedPercentage:
        radicalsTotal > 0 ? Math.round((radicalsStarted / radicalsTotal) * 100) : 0,
      guru: radicalsGuruCount,
      guruPercentage:
        radicalsTotal > 0 ? Math.round((radicalsGuruCount / radicalsTotal) * 100) : 0,
      total: radicalsTotal,
    },
    kanji: {
      started: kanjiStarted,
      startedPercentage: kanjiTotal > 0 ? Math.round((kanjiStarted / kanjiTotal) * 100) : 0,
      guru: kanjiGuruCount,
      guruPercentage: kanjiTotal > 0 ? Math.round((kanjiGuruCount / kanjiTotal) * 100) : 0,
      total: kanjiTotal,
    },
    vocabulary: {
      started: vocabularyStarted,
      startedPercentage:
        vocabularyTotal > 0 ? Math.round((vocabularyStarted / vocabularyTotal) * 100) : 0,
      guru: vocabularyGuruCount,
      guruPercentage:
        vocabularyTotal > 0 ? Math.round((vocabularyGuruCount / vocabularyTotal) * 100) : 0,
      total: vocabularyTotal,
    },
    kanjiNeededToLevelUp: kanjiNeeded,
    daysOnLevel,
    passedAt: levelPassedAt ?? null,
    isCurrentLevel: selectedLevel === userCurrentLevel,
  }
}
