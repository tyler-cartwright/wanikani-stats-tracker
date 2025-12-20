// Level Progression Forecast Calculations
import type { Subject, Assignment } from '@/lib/api/types'

export interface LevelProgressionForecastInput {
  subjects: (Subject & { id: number })[]
  assignments: Assignment[]
  currentLevel: number
  lessonsPerDay: number
  forecastDays: number
  includeVocabulary: boolean
}

export interface LevelProgressionForecastResult {
  startingLevel: number
  projectedLevel: number
  lessonsCompleted: number
  progressInFinalLevel: number // percentage (0-100)
  levelsGained: number
  completedWaniKani: boolean
}

/**
 * Calculate projected level progression based on lesson pace
 *
 * This function determines what level a user will reach given their lesson pace.
 * It accounts for their current progress in their level and optionally excludes
 * vocabulary from the calculation.
 */
export function calculateLevelProgressionForecast(
  input: LevelProgressionForecastInput
): LevelProgressionForecastResult {
  const {
    subjects,
    assignments,
    currentLevel,
    lessonsPerDay,
    forecastDays,
    includeVocabulary,
  } = input

  // Create assignment lookup by subject_id
  const assignmentMap = new Map<number, Assignment>()
  for (const assignment of assignments) {
    assignmentMap.set(assignment.subject_id, assignment)
  }

  // Count unstarted lessons per level by type
  const lessonsByLevel = new Map<number, { radicals: number; kanji: number; vocabulary: number }>()

  for (const subject of subjects) {
    const level = subject.level
    const assignment = assignmentMap.get(subject.id)

    // Only count items that haven't been started yet (no lessons done)
    const isUnstarted = !assignment || assignment.started_at === null

    if (!isUnstarted) continue

    // Initialize level if not exists
    if (!lessonsByLevel.has(level)) {
      lessonsByLevel.set(level, { radicals: 0, kanji: 0, vocabulary: 0 })
    }

    const counts = lessonsByLevel.get(level)!

    // Determine subject type
    if ('character_images' in subject) {
      // Radical
      counts.radicals++
    } else if ('readings' in subject && 'type' in subject.readings[0]) {
      // Kanji (has readings with 'type' property)
      counts.kanji++
    } else if ('context_sentences' in subject) {
      // Vocabulary
      counts.vocabulary++
    }
  }

  // Calculate total lessons available
  const totalLessonsAvailable = lessonsPerDay * forecastDays
  let lessonsRemaining = totalLessonsAvailable

  // Walk through levels starting from current level
  let projectedLevel = currentLevel
  let progressInFinalLevel = 0

  for (let level = currentLevel; level <= 60; level++) {
    const counts = lessonsByLevel.get(level)

    if (!counts) {
      // No lessons in this level, move to next
      continue
    }

    // Calculate total lessons in this level based on includeVocabulary setting
    let lessonsInLevel = counts.radicals + counts.kanji
    if (includeVocabulary) {
      lessonsInLevel += counts.vocabulary
    }

    if (lessonsInLevel === 0) {
      // No lessons remaining in this level, move to next
      continue
    }

    if (lessonsRemaining >= lessonsInLevel) {
      // Can complete this entire level
      lessonsRemaining -= lessonsInLevel
      projectedLevel = level
      progressInFinalLevel = 100
    } else {
      // Partially complete this level
      projectedLevel = level
      progressInFinalLevel = Math.round((lessonsRemaining / lessonsInLevel) * 100)
      lessonsRemaining = 0
      break
    }

    // Check if we've exhausted all lessons
    if (lessonsRemaining === 0) {
      break
    }
  }

  const lessonsCompleted = totalLessonsAvailable - lessonsRemaining
  const levelsGained = projectedLevel - currentLevel
  const completedWaniKani = projectedLevel === 60 && progressInFinalLevel === 100

  return {
    startingLevel: currentLevel,
    projectedLevel,
    lessonsCompleted,
    progressInFinalLevel,
    levelsGained,
    completedWaniKani,
  }
}
