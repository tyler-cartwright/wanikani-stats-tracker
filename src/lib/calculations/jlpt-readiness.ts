import type { EnrichedSubject } from './kanji-grid'
import type {
  JoyoGrade,
  JLPTLevel,
  SRSThreshold,
  JoyoLevelData,
  JoyoReadinessResult,
} from '@/data/jlpt'
import { JOYO_KANJI, JOYO_GRADES, JOYO_GRADE_INFO } from '@/data/jlpt'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map SRS threshold to minimum SRS stage number
 */
export function getMinSrsStage(threshold: SRSThreshold): number {
  const mapping: Record<SRSThreshold, number> = {
    apprentice_4: 4,
    guru: 5,
    master: 7,
    enlightened: 8,
    burned: 9,
  }
  return mapping[threshold]
}

/**
 * Check if a subject meets the SRS threshold
 */
function meetsThreshold(srsStage: number, threshold: SRSThreshold): boolean {
  return srsStage >= getMinSrsStage(threshold)
}

/**
 * Match WaniKani subjects to Jōyō kanji by character
 * Returns a map of kanji character -> WaniKani subject
 */
function matchKanjiSubjects(
  joyoKanji: string[],
  subjects: EnrichedSubject[]
): Map<string, EnrichedSubject | null> {
  const result = new Map<string, EnrichedSubject | null>()

  // Create a lookup map for WaniKani kanji subjects by character
  const subjectMap = new Map<string, EnrichedSubject>()
  for (const subject of subjects) {
    if (subject.subjectType === 'kanji' && subject.character) {
      subjectMap.set(subject.character, subject)
    }
  }

  // Match Jōyō kanji to WaniKani subjects
  for (const kanji of joyoKanji) {
    const match = subjectMap.get(kanji)
    result.set(kanji, match || null)
  }

  return result
}

/**
 * Calculate readiness for a single Jōyō grade level
 */
function calculateGradeReadiness(
  grade: JoyoGrade,
  kanjiMatches: Map<string, EnrichedSubject | null>,
  threshold: SRSThreshold
): JoyoLevelData {
  const { label, ageRange } = JOYO_GRADE_INFO[grade]

  // Count kanji
  let kanjiKnown = 0
  let kanjiInWK = 0
  for (const [, subject] of kanjiMatches) {
    if (subject) {
      kanjiInWK++
      if (meetsThreshold(subject.srsStage, threshold)) {
        kanjiKnown++
      }
    }
  }

  const kanjiTotal = kanjiMatches.size
  const kanjiPercentage = kanjiInWK > 0 ? (kanjiKnown / kanjiInWK) * 100 : 0

  return {
    grade,
    label,
    ageRange,
    kanji: {
      total: kanjiTotal,
      known: kanjiKnown,
      inWanikani: kanjiInWK,
      percentage: Math.round(kanjiPercentage),
    },
    isComplete: kanjiPercentage >= 90, // 90%+ = complete
  }
}

/**
 * Calculate frequency coverage based on cumulative kanji known
 * This is an approximation based on kanji frequency research from newspaper corpora:
 * - 500 most frequent kanji ≈ 80% coverage
 * - 1000 kanji ≈ 90% coverage
 * - 1600 kanji ≈ 99% coverage
 * - 2136 kanji (all Jōyō) ≈ 99%+ coverage
 *
 * Note: These percentages are based on the most frequent kanji in text. Since Jōyō
 * kanji are organized by educational grade (not pure frequency), actual coverage may
 * vary slightly depending on which specific kanji have been learned.
 */
function calculateFrequencyCoverage(totalKanjiKnown: number): number {
  if (totalKanjiKnown === 0) return 0
  if (totalKanjiKnown >= 2136) return 99

  // Piecewise linear interpolation based on research data
  if (totalKanjiKnown <= 500) {
    // 0-500: Linear scale to 80%
    return (totalKanjiKnown / 500) * 80
  } else if (totalKanjiKnown <= 1000) {
    // 500-1000: From 80% to 90%
    return 80 + ((totalKanjiKnown - 500) / 500) * 10
  } else if (totalKanjiKnown <= 1600) {
    // 1000-1600: From 90% to 99%
    return 90 + ((totalKanjiKnown - 1000) / 600) * 9
  } else {
    // 1600-2136: Stay at 99%
    return 99
  }
}

/**
 * Approximate JLPT level based on cumulative Jōyō grade completion
 * This is a rough estimate with the following mappings:
 * - Grade 1-2 complete (240 kanji) → N5-N4
 * - Grade 1-4 complete (642 kanji) → N3
 * - Grade 1-6 complete (1026 kanji) → N2
 * - All Jōyō complete (2136 kanji) → N1
 */
function approximateJlptLevel(
  grades: JoyoLevelData[],
  totalKanjiKnown: number
): JLPTLevel | null {
  if (totalKanjiKnown < 50) return null // Too early to estimate

  // Check grade completion
  const grade1Complete = grades.find((g) => g.grade === 'grade_1')?.isComplete ?? false
  const grade2Complete = grades.find((g) => g.grade === 'grade_2')?.isComplete ?? false
  const grade3Complete = grades.find((g) => g.grade === 'grade_3')?.isComplete ?? false
  const grade4Complete = grades.find((g) => g.grade === 'grade_4')?.isComplete ?? false
  const grade5Complete = grades.find((g) => g.grade === 'grade_5')?.isComplete ?? false
  const grade6Complete = grades.find((g) => g.grade === 'grade_6')?.isComplete ?? false
  const secondaryComplete = grades.find((g) => g.grade === 'secondary')?.isComplete ?? false

  // N1: All Jōyō complete
  if (
    grade1Complete &&
    grade2Complete &&
    grade3Complete &&
    grade4Complete &&
    grade5Complete &&
    grade6Complete &&
    secondaryComplete
  ) {
    return 'N1'
  }

  // N2: Elementary school complete (Grades 1-6)
  if (
    grade1Complete &&
    grade2Complete &&
    grade3Complete &&
    grade4Complete &&
    grade5Complete &&
    grade6Complete
  ) {
    return 'N2'
  }

  // N3: Grades 1-4 complete
  if (grade1Complete && grade2Complete && grade3Complete && grade4Complete) {
    return 'N3'
  }

  // N4: Grades 1-2 complete
  if (grade1Complete && grade2Complete) {
    return 'N4'
  }

  // N5: Grade 1 complete
  if (grade1Complete) {
    return 'N5'
  }

  return null
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculate Jōyō kanji readiness for all grade levels
 */
export function calculateJLPTReadiness(
  subjects: EnrichedSubject[],
  threshold: SRSThreshold
): JoyoReadinessResult {
  const grades: JoyoLevelData[] = []

  // Calculate readiness for each Jōyō grade level
  for (const grade of JOYO_GRADES) {
    const joyoKanji = JOYO_KANJI[grade] || []
    const kanjiMatches = matchKanjiSubjects(joyoKanji, subjects)
    const gradeData = calculateGradeReadiness(grade, kanjiMatches, threshold)
    grades.push(gradeData)
  }

  // Calculate totals
  let totalKanjiKnown = 0
  let totalKanjiInWanikani = 0
  for (const grade of grades) {
    totalKanjiKnown += grade.kanji.known
    totalKanjiInWanikani += grade.kanji.inWanikani
  }

  // Find current grade (highest grade at 90%+ completion)
  const completeGrades = grades.filter((g) => g.isComplete)
  const currentGrade = completeGrades.length > 0 ? completeGrades[completeGrades.length - 1].grade : null

  // Calculate frequency coverage
  const frequencyCoverage = Math.round(calculateFrequencyCoverage(totalKanjiKnown))

  // Approximate JLPT level
  const approximateJlpt = approximateJlptLevel(grades, totalKanjiKnown)

  return {
    currentGrade,
    grades,
    frequencyCoverage,
    approximateJlpt,
    threshold,
    totalKanjiKnown,
    totalKanjiInWanikani,
  }
}

/**
 * Get cumulative counts up to a specific grade (includes all lower grades)
 */
export function getCumulativeCounts(
  readiness: JoyoReadinessResult,
  targetGrade: JoyoGrade
): {
  kanjiKnown: number
  kanjiTotal: number
  kanjiInWK: number
  percentage: number
} {
  const gradeOrder: JoyoGrade[] = [
    'grade_1',
    'grade_2',
    'grade_3',
    'grade_4',
    'grade_5',
    'grade_6',
    'secondary',
  ]
  const targetIndex = gradeOrder.indexOf(targetGrade)

  let kanjiKnown = 0
  let kanjiTotal = 0
  let kanjiInWK = 0

  // Sum up all grades up to and including the target grade
  for (let i = 0; i <= targetIndex; i++) {
    const grade = readiness.grades.find((g) => g.grade === gradeOrder[i])
    if (grade) {
      kanjiKnown += grade.kanji.known
      kanjiTotal += grade.kanji.total
      kanjiInWK += grade.kanji.inWanikani
    }
  }

  const percentage = kanjiInWK > 0 ? Math.round((kanjiKnown / kanjiInWK) * 100) : 0

  return {
    kanjiKnown,
    kanjiTotal,
    kanjiInWK,
    percentage,
  }
}
