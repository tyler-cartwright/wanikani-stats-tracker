// Accuracy Calculations
import type { ReviewStatistic, Subject } from '@/lib/api/types'

export interface AccuracyMetrics {
  overall: number
  meaning: number
  reading: number
  totalReviews: number
  counts: {
    reading: { correct: number; incorrect: number; total: number }
    meaning: { correct: number; incorrect: number; total: number }
    total: { correct: number; incorrect: number; total: number }
  }
  byType: {
    radicals: { overall: number; reading: number | null; meaning: number }
    kanji: { overall: number; reading: number; meaning: number }
    vocabulary: { overall: number; reading: number; meaning: number }
  }
  byLevel: Map<number, number>
}

/**
 * Calculate comprehensive accuracy metrics from review statistics
 */
export function calculateAccuracyMetrics(
  reviewStats: ReviewStatistic[],
  subjects: (Subject & { id: number })[]
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

  // By type — track reading and meaning separately
  const typeStats = {
    radicals: { meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    kanji: { meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
    vocabulary: { meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
  }

  // By level
  const levelStats = new Map<number, { correct: number; incorrect: number }>()

  for (const stat of reviewStats) {
    // Exclude hidden items - they're not in active review rotation
    if (stat.hidden) continue

    const subject = subjectMap.get(stat.subject_id)
    if (!subject) continue

    // Only kanji and vocabulary have a reading component.
    // Radicals have none by design; kana_vocabulary is meaning-only.
    // Both may carry non-zero reading_correct in the API due to historical data,
    // so we derive reading counts from subject_type rather than trusting API fields to be zero.
    const hasReadingComponent =
      stat.subject_type === 'kanji' || stat.subject_type === 'vocabulary'
    const statReadingCorrect = hasReadingComponent ? stat.reading_correct : 0
    const statReadingIncorrect = hasReadingComponent ? stat.reading_incorrect : 0

    // Overall
    const statTotalCorrect = stat.meaning_correct + statReadingCorrect
    const statTotalIncorrect = stat.meaning_incorrect + statReadingIncorrect
    totalCorrect += statTotalCorrect
    totalIncorrect += statTotalIncorrect

    // Meaning vs Reading
    meaningCorrect += stat.meaning_correct
    meaningIncorrect += stat.meaning_incorrect
    readingCorrect += statReadingCorrect
    readingIncorrect += statReadingIncorrect

    // By type
    const typeKey =
      stat.subject_type === 'kana_vocabulary' ? 'vocabulary' : stat.subject_type

    if (typeKey === 'radical') {
      typeStats.radicals.meaningCorrect += stat.meaning_correct
      typeStats.radicals.meaningIncorrect += stat.meaning_incorrect
      // radicals have no reading reviews; reading fields on their stats should be 0
      typeStats.radicals.readingCorrect += stat.reading_correct
      typeStats.radicals.readingIncorrect += stat.reading_incorrect
    } else if (typeKey === 'kanji') {
      typeStats.kanji.meaningCorrect += stat.meaning_correct
      typeStats.kanji.meaningIncorrect += stat.meaning_incorrect
      typeStats.kanji.readingCorrect += stat.reading_correct
      typeStats.kanji.readingIncorrect += stat.reading_incorrect
    } else if (typeKey === 'vocabulary') {
      typeStats.vocabulary.meaningCorrect += stat.meaning_correct
      typeStats.vocabulary.meaningIncorrect += stat.meaning_incorrect
      // kana_vocabulary has no reading component
      typeStats.vocabulary.readingCorrect += statReadingCorrect
      typeStats.vocabulary.readingIncorrect += statReadingIncorrect
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

  const overall = overallTotal > 0 ? parseFloat(((totalCorrect / overallTotal) * 100).toFixed(2)) : 0
  const meaning = meaningTotal > 0 ? parseFloat(((meaningCorrect / meaningTotal) * 100).toFixed(2)) : 0
  const reading = readingTotal > 0 ? parseFloat(((readingCorrect / readingTotal) * 100).toFixed(2)) : 0

  // By type percentages
  const radMeaningTotal = typeStats.radicals.meaningCorrect + typeStats.radicals.meaningIncorrect
  const radOverallTotal = radMeaningTotal // radicals have no reading
  const kanjiMeaningTotal = typeStats.kanji.meaningCorrect + typeStats.kanji.meaningIncorrect
  const kanjiReadingTotal = typeStats.kanji.readingCorrect + typeStats.kanji.readingIncorrect
  const kanjiOverallTotal = kanjiMeaningTotal + kanjiReadingTotal
  const vocabMeaningTotal = typeStats.vocabulary.meaningCorrect + typeStats.vocabulary.meaningIncorrect
  const vocabReadingTotal = typeStats.vocabulary.readingCorrect + typeStats.vocabulary.readingIncorrect
  const vocabOverallTotal = vocabMeaningTotal + vocabReadingTotal

  const byType = {
    radicals: {
      overall: radOverallTotal > 0 ? parseFloat(((typeStats.radicals.meaningCorrect / radOverallTotal) * 100).toFixed(2)) : 0,
      reading: null as number | null,
      meaning: radMeaningTotal > 0 ? parseFloat(((typeStats.radicals.meaningCorrect / radMeaningTotal) * 100).toFixed(2)) : 0,
    },
    kanji: {
      overall: kanjiOverallTotal > 0 ? parseFloat((((typeStats.kanji.meaningCorrect + typeStats.kanji.readingCorrect) / kanjiOverallTotal) * 100).toFixed(2)) : 0,
      reading: kanjiReadingTotal > 0 ? parseFloat(((typeStats.kanji.readingCorrect / kanjiReadingTotal) * 100).toFixed(2)) : 0,
      meaning: kanjiMeaningTotal > 0 ? parseFloat(((typeStats.kanji.meaningCorrect / kanjiMeaningTotal) * 100).toFixed(2)) : 0,
    },
    vocabulary: {
      overall: vocabOverallTotal > 0 ? parseFloat((((typeStats.vocabulary.meaningCorrect + typeStats.vocabulary.readingCorrect) / vocabOverallTotal) * 100).toFixed(2)) : 0,
      reading: vocabReadingTotal > 0 ? parseFloat(((typeStats.vocabulary.readingCorrect / vocabReadingTotal) * 100).toFixed(2)) : 0,
      meaning: vocabMeaningTotal > 0 ? parseFloat(((typeStats.vocabulary.meaningCorrect / vocabMeaningTotal) * 100).toFixed(2)) : 0,
    },
  }

  // By level percentages
  const byLevel = new Map<number, number>()
  levelStats.forEach((stat, level) => {
    const levelTotal = stat.correct + stat.incorrect
    if (levelTotal > 0) {
      byLevel.set(level, parseFloat(((stat.correct / levelTotal) * 100).toFixed(2)))
    }
  })

  return {
    overall,
    meaning,
    reading,
    totalReviews: totalCorrect + totalIncorrect,
    counts: {
      reading: {
        correct: readingCorrect,
        incorrect: readingIncorrect,
        total: readingTotal,
      },
      meaning: {
        correct: meaningCorrect,
        incorrect: meaningIncorrect,
        total: meaningTotal,
      },
      total: {
        correct: totalCorrect,
        incorrect: totalIncorrect,
        total: overallTotal,
      },
    },
    byType,
    byLevel,
  }
}

/**
 * Calculate accuracy by hour of day (0-23)
 * Requires review timestamps (not available in review_statistics endpoint)
 * This would need the reviews endpoint which we haven't implemented yet
 * Returning placeholder for now
 */
export function calculateAccuracyByHour(): Map<number, number> {
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
