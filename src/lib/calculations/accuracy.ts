// Accuracy Calculations
import type { ReviewStatistic, Subject } from '@/lib/api/types'

export interface AccuracyMetrics {
  overall: number
  meaning: number
  reading: number
  byType: {
    radicals: number
    kanji: number
    vocabulary: number
  }
  byLevel: Map<number, number>
  totalReviews: number
}

/**
 * Calculate comprehensive accuracy metrics from review statistics
 */
export function calculateAccuracyMetrics(
  reviewStats: ReviewStatistic[],
  subjects: Subject[]
): AccuracyMetrics {
  // Create subject lookup map
  const subjectMap = new Map<number, Subject & { id: number }>()
  subjects.forEach((subject) => {
    subjectMap.set(subject.id, subject)
  })

  let totalCorrect = 0
  let totalIncorrect = 0
  let meaningCorrect = 0
  let meaningIncorrect = 0
  let readingCorrect = 0
  let readingIncorrect = 0

  // By type
  const typeStats = {
    radicals: { correct: 0, incorrect: 0 },
    kanji: { correct: 0, incorrect: 0 },
    vocabulary: { correct: 0, incorrect: 0 },
  }

  // By level
  const levelStats = new Map<number, { correct: number; incorrect: number }>()

  for (const stat of reviewStats) {
    if (stat.hidden) continue

    const subject = subjectMap.get(stat.subject_id)
    if (!subject) continue

    // Overall
    const statTotalCorrect = stat.meaning_correct + stat.reading_correct
    const statTotalIncorrect = stat.meaning_incorrect + stat.reading_incorrect
    totalCorrect += statTotalCorrect
    totalIncorrect += statTotalIncorrect

    // Meaning vs Reading
    meaningCorrect += stat.meaning_correct
    meaningIncorrect += stat.meaning_incorrect
    readingCorrect += stat.reading_correct
    readingIncorrect += stat.reading_incorrect

    // By type
    const typeKey =
      stat.subject_type === 'kana_vocabulary' ? 'vocabulary' : stat.subject_type

    if (typeKey === 'radical' && typeStats.radicals) {
      typeStats.radicals.correct += statTotalCorrect
      typeStats.radicals.incorrect += statTotalIncorrect
    } else if (typeKey === 'kanji' && typeStats.kanji) {
      typeStats.kanji.correct += statTotalCorrect
      typeStats.kanji.incorrect += statTotalIncorrect
    } else if (typeKey === 'vocabulary' && typeStats.vocabulary) {
      typeStats.vocabulary.correct += statTotalCorrect
      typeStats.vocabulary.incorrect += statTotalIncorrect
    }

    // By level
    if ('level' in subject && subject.level !== undefined) {
      const level = subject.level
      if (!levelStats.has(level)) {
        levelStats.set(level, { correct: 0, incorrect: 0 })
      }
      const levelStat = levelStats.get(level)
      if (levelStat) {
        levelStat.correct += statTotalCorrect
        levelStat.incorrect += statTotalIncorrect
      }
    }
  }

  // Calculate percentages
  const overallTotal = totalCorrect + totalIncorrect
  const meaningTotal = meaningCorrect + meaningIncorrect
  const readingTotal = readingCorrect + readingIncorrect

  const overall = overallTotal > 0 ? Math.round((totalCorrect / overallTotal) * 100) : 0
  const meaning = meaningTotal > 0 ? Math.round((meaningCorrect / meaningTotal) * 100) : 0
  const reading = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 100) : 0

  // By type percentages
  const radicalsTotal = typeStats.radicals.correct + typeStats.radicals.incorrect
  const kanjiTotal = typeStats.kanji.correct + typeStats.kanji.incorrect
  const vocabularyTotal = typeStats.vocabulary.correct + typeStats.vocabulary.incorrect

  const byType = {
    radicals: radicalsTotal > 0 ? Math.round((typeStats.radicals.correct / radicalsTotal) * 100) : 0,
    kanji: kanjiTotal > 0 ? Math.round((typeStats.kanji.correct / kanjiTotal) * 100) : 0,
    vocabulary:
      vocabularyTotal > 0 ? Math.round((typeStats.vocabulary.correct / vocabularyTotal) * 100) : 0,
  }

  // By level percentages
  const byLevel = new Map<number, number>()
  levelStats.forEach((stat, level) => {
    const levelTotal = stat.correct + stat.incorrect
    if (levelTotal > 0) {
      byLevel.set(level, Math.round((stat.correct / levelTotal) * 100))
    }
  })

  return {
    overall,
    meaning,
    reading,
    byType,
    byLevel,
    totalReviews: totalCorrect + totalIncorrect,
  }
}

/**
 * Calculate accuracy by hour of day (0-23)
 * Requires review timestamps (not available in review_statistics endpoint)
 * This would need the reviews endpoint which we haven't implemented yet
 * Returning placeholder for now
 */
export function calculateAccuracyByHour(
  reviewStats: ReviewStatistic[]
): Map<number, number> {
  // This would need actual review data with timestamps
  // For now, return empty map
  // TODO: Implement when reviews endpoint is added
  return new Map()
}

/**
 * Get items with accuracy below threshold
 */
export function getLowAccuracyItems(
  reviewStats: ReviewStatistic[],
  threshold: number = 70
): ReviewStatistic[] {
  return reviewStats
    .filter((stat) => !stat.hidden && stat.percentage_correct < threshold)
    .sort((a, b) => a.percentage_correct - b.percentage_correct)
}
