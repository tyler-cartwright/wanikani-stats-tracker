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
}

/**
 * Calculate progress for current level
 *
 * Level up requirement: Pass 90% of kanji for the level
 */
export function calculateLevelProgress(
  assignments: Assignment[],
  subjects: (Subject & { id: number })[],
  currentLevel: number,
  levelStartDate?: string
): LevelProgressData {
  // Create subject lookup map
  const subjectMap = new Map<number, Subject & { id: number }>()
  subjects.forEach((subject) => {
    subjectMap.set(subject.id, subject)
  })

  // Filter assignments and subjects for current level
  const levelAssignments = assignments.filter((a) => {
    const subject = subjectMap.get(a.subject_id)
    return subject && 'level' in subject && subject.level === currentLevel
  })

  // Count by type
  let radicalsTotal = 0
  let radicalsPassedCount = 0
  let kanjiTotal = 0
  let kanjiPassedCount = 0
  let vocabularyTotal = 0
  let vocabularyPassedCount = 0

  for (const assignment of levelAssignments) {
    const subject = subjectMap.get(assignment.subject_id)
    if (!subject || assignment.hidden) continue

    // Check if this subject is at the current level
    if ('level' in subject && subject.level !== currentLevel) continue

    const passed = assignment.passed

    switch (assignment.subject_type) {
      case 'radical':
        radicalsTotal++
        if (passed) radicalsPassedCount++
        break
      case 'kanji':
        kanjiTotal++
        if (passed) kanjiPassedCount++
        break
      case 'vocabulary':
      case 'kana_vocabulary':
        vocabularyTotal++
        if (passed) vocabularyPassedCount++
        break
    }
  }

  // Calculate kanji needed to level up (90% of total kanji)
  const kanjiNeededForLevelUp = Math.ceil(kanjiTotal * 0.9)
  const kanjiNeeded = Math.max(0, kanjiNeededForLevelUp - kanjiPassedCount)

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
      current: radicalsPassedCount,
      total: radicalsTotal,
      percentage: radicalsTotal > 0 ? Math.round((radicalsPassedCount / radicalsTotal) * 100) : 0,
    },
    kanji: {
      current: kanjiPassedCount,
      total: kanjiTotal,
      percentage: kanjiTotal > 0 ? Math.round((kanjiPassedCount / kanjiTotal) * 100) : 0,
    },
    vocabulary: {
      current: vocabularyPassedCount,
      total: vocabularyTotal,
      percentage:
        vocabularyTotal > 0 ? Math.round((vocabularyPassedCount / vocabularyTotal) * 100) : 0,
    },
    kanjiNeededToLevelUp: kanjiNeeded,
    daysOnLevel,
  }
}
