// Level Progress Calculations
import type { Assignment, Subject } from '@/lib/api/types'

export interface LevelProgressData {
  radicals: {
    current: number
    total: number
    percentage: number
  }
  kanji: {
    current: number
    total: number
    percentage: number
  }
  vocabulary: {
    current: number
    total: number
    percentage: number
  }
  kanjiNeededToLevelUp: number
  daysOnLevel: number
  averageDaysPerLevel?: number // total average (includes all levels)
  activeDaysPerLevel?: number // active learning average (excludes breaks)
  excludedLevels?: number[] // which levels were filtered out
}

/**
 * Calculate progress for current level
 *
 * Level up requirement: Pass 90% of kanji for the level (Guru or higher)
 * Progress counts items at Guru I or higher (SRS stage >= 5)
 */
export function calculateLevelProgress(
  assignments: Assignment[],
  subjects: (Subject & { id: number })[],
  currentLevel: number,
  levelStartDate?: string
): LevelProgressData {
  // Create assignment lookup map
  const assignmentMap = new Map<number, Assignment>()
  assignments.forEach((assignment) => {
    assignmentMap.set(assignment.subject_id, assignment)
  })

  // Count ALL subjects in the current level (not just unlocked ones)
  let radicalsTotal = 0
  let radicalsGuruCount = 0
  let kanjiTotal = 0
  let kanjiGuruCount = 0
  let vocabularyTotal = 0
  let vocabularyGuruCount = 0

  for (const subject of subjects) {
    // Skip if not current level
    if (!('level' in subject) || subject.level !== currentLevel) continue

    // Get assignment if it exists
    const assignment = assignmentMap.get(subject.id)

    // Count totals based on subject type
    if ('character_images' in subject) {
      // Radical
      radicalsTotal++
      // Count as guru if assignment exists, not hidden, and SRS stage >= 5 (Guru I or higher)
      if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
        radicalsGuruCount++
      }
    } else if ('component_subject_ids' in subject && 'readings' in subject) {
      // Check if it's kanji (has readings with type property)
      const hasKanjiReadings = subject.readings.some((r: any) => 'type' in r)
      if (hasKanjiReadings) {
        // Kanji
        kanjiTotal++
        if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
          kanjiGuruCount++
        }
      } else {
        // Vocabulary
        vocabularyTotal++
        if (assignment && !assignment.hidden && assignment.srs_stage >= 5) {
          vocabularyGuruCount++
        }
      }
    } else {
      // Kana vocabulary (no component_subject_ids)
      vocabularyTotal++
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
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - startDate.getTime())
    daysOnLevel = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return {
    radicals: {
      current: radicalsGuruCount,
      total: radicalsTotal,
      percentage: radicalsTotal > 0 ? Math.round((radicalsGuruCount / radicalsTotal) * 100) : 0,
    },
    kanji: {
      current: kanjiGuruCount,
      total: kanjiTotal,
      percentage: kanjiTotal > 0 ? Math.round((kanjiGuruCount / kanjiTotal) * 100) : 0,
    },
    vocabulary: {
      current: vocabularyGuruCount,
      total: vocabularyTotal,
      percentage:
        vocabularyTotal > 0 ? Math.round((vocabularyGuruCount / vocabularyTotal) * 100) : 0,
    },
    kanjiNeededToLevelUp: kanjiNeeded,
    daysOnLevel,
  }
}
