// Leech Detection and Analysis
import type { ReviewStatistic, Subject, Assignment } from '@/lib/api/types'

export interface LeechReadings {
  primary: string | null
  primaryType: 'onyomi' | 'kunyomi' | null // for kanji
  onyomi: string[]
  kunyomi: string[]
  vocabulary: string[]
}

export interface LeechItem {
  subjectId: number
  character: string
  meaning: string
  type: 'radical' | 'kanji' | 'vocabulary'
  level: number
  accuracy: number
  totalReviews: number
  incorrectCount: number
  severity: number // 0-100 score
  meaningAccuracy: number
  readingAccuracy: number
  currentSRS: number
  readings: LeechReadings
  allMeanings: string[]
  documentUrl: string
}

export interface ConfusionPair {
  item1: LeechItem
  item2: LeechItem
  similarity: number
}

export interface RootCauseRadical {
  radical: string
  radicalId: number
  name: string
  affectedCount: number
  affectedItems: LeechItem[]
}

/**
 * Extract readings from a subject based on its type
 */
function extractReadings(subject: Subject): LeechReadings {
  const emptyReadings: LeechReadings = {
    primary: null,
    primaryType: null,
    onyomi: [],
    kunyomi: [],
    vocabulary: [],
  }

  // Radicals don't have readings
  if ('character_images' in subject) {
    return emptyReadings
  }

  // Kanji subjects
  if ('readings' in subject && 'visually_similar_subject_ids' in subject) {
    const kanjiReadings = subject.readings
    const onyomi = kanjiReadings.filter((r) => r.type === 'onyomi').map((r) => r.reading)
    const kunyomi = kanjiReadings.filter((r) => r.type === 'kunyomi').map((r) => r.reading)
    const primary = kanjiReadings.find((r) => r.primary)

    return {
      primary: primary?.reading || null,
      primaryType: primary?.type === 'nanori' ? null : (primary?.type || null),
      onyomi,
      kunyomi,
      vocabulary: [],
    }
  }

  // Vocabulary subjects
  if ('readings' in subject) {
    const vocabReadings = subject.readings.map((r) => r.reading)
    const primary = subject.readings.find((r) => r.primary)

    return {
      primary: primary?.reading || null,
      primaryType: null,
      onyomi: [],
      kunyomi: [],
      vocabulary: vocabReadings,
    }
  }

  return emptyReadings
}

/**
 * Detect leeches based on accuracy and review count
 *
 * Default criteria:
 * - At least 10 reviews
 * - Accuracy below 75%
 */
export function detectLeeches(
  reviewStats: ReviewStatistic[],
  subjects: (Subject & { id: number })[],
  assignments: Assignment[],
  threshold: { minReviews?: number; maxAccuracy?: number; includeBurned?: boolean } = {}
): LeechItem[] {
  const minReviews = threshold.minReviews ?? 10
  const maxAccuracy = threshold.maxAccuracy ?? 75
  const includeBurned = threshold.includeBurned ?? false

  // Create lookup maps
  const subjectMap = new Map<number, Subject & { id: number }>()
  subjects.forEach((subject) => {
    subjectMap.set(subject.id, subject)
  })

  const assignmentMap = new Map<number, Assignment>()
  assignments.forEach((assignment) => {
    assignmentMap.set(assignment.subject_id, assignment)
  })

  const leeches: LeechItem[] = []

  for (const stat of reviewStats) {
    // Exclude hidden items - they're not in active review rotation
    if (stat.hidden) continue

    const subject = subjectMap.get(stat.subject_id)
    if (!subject) continue

    const assignment = assignmentMap.get(stat.subject_id)
    if (!assignment) continue

    // Optionally exclude burned items (SRS stage 9)
    if (!includeBurned && assignment.srs_stage === 9) continue

    const totalReviews =
      stat.meaning_correct +
      stat.meaning_incorrect +
      stat.reading_correct +
      stat.reading_incorrect

    const incorrectCount = stat.meaning_incorrect + stat.reading_incorrect

    // Check if meets leech criteria
    if (totalReviews >= minReviews && stat.percentage_correct <= maxAccuracy) {
      const meaningTotal = stat.meaning_correct + stat.meaning_incorrect
      const readingTotal = stat.reading_correct + stat.reading_incorrect

      const meaningAccuracy =
        meaningTotal > 0 ? Math.round((stat.meaning_correct / meaningTotal) * 100) : 100

      const readingAccuracy =
        readingTotal > 0 ? Math.round((stat.reading_correct / readingTotal) * 100) : 100

      // Calculate severity (higher is worse)
      const severity = calculateSeverity(incorrectCount, totalReviews, stat.percentage_correct)

      const character = ('characters' in subject ? subject.characters : null) || '?'
      const meaning = subject.meanings.find((m) => m.primary)?.meaning ?? 'Unknown'
      const type =
        stat.subject_type === 'kana_vocabulary' ? 'vocabulary' : stat.subject_type
      const level = 'level' in subject ? subject.level : 0

      // Extract all meanings
      const allMeanings = subject.meanings
        .filter((m) => m.accepted_answer)
        .map((m) => m.meaning)

      // Extract readings
      const readings = extractReadings(subject)

      leeches.push({
        subjectId: stat.subject_id,
        character,
        meaning,
        type: type as 'radical' | 'kanji' | 'vocabulary',
        level,
        accuracy: stat.percentage_correct,
        totalReviews,
        incorrectCount,
        severity,
        meaningAccuracy,
        readingAccuracy,
        currentSRS: assignment.srs_stage,
        readings,
        allMeanings,
        documentUrl: subject.document_url,
      })
    }
  }

  // Sort by severity (highest first)
  return leeches.sort((a, b) => b.severity - a.severity)
}

/**
 * Calculate severity score for a leech
 * Factors: incorrect count, total reviews, accuracy
 *
 * Returns 0-100 score (higher = worse)
 */
export function calculateSeverity(
  incorrectCount: number,
  totalReviews: number,
  accuracy: number
): number {
  // Weight factors
  const incorrectWeight = 0.4
  const volumeWeight = 0.3
  const accuracyWeight = 0.3

  // Normalize incorrect count (cap at 50)
  const incorrectScore = Math.min(incorrectCount / 50, 1) * 100

  // Normalize review volume (more reviews = more severe)
  const volumeScore = Math.min(totalReviews / 100, 1) * 100

  // Invert accuracy (lower accuracy = higher score)
  const accuracyScore = 100 - accuracy

  const severity =
    incorrectScore * incorrectWeight +
    volumeScore * volumeWeight +
    accuracyScore * accuracyWeight

  return Math.round(severity)
}

/**
 * Find confusion pairs - leeches with similar characters or readings
 * This is a simple implementation - could be enhanced with edit distance
 */
export function findConfusionPairs(leeches: LeechItem[]): ConfusionPair[] {
  const pairs: ConfusionPair[] = []

  for (let i = 0; i < leeches.length; i++) {
    for (let j = i + 1; j < leeches.length; j++) {
      const item1 = leeches[i]
      const item2 = leeches[j]

      // Check for character similarity (simple check)
      const charSimilarity = calculateCharacterSimilarity(item1.character, item2.character)

      if (charSimilarity > 0.5) {
        pairs.push({
          item1,
          item2,
          similarity: charSimilarity,
        })
      }
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 10) // Top 10 pairs
}

/**
 * Simple character similarity check
 * Returns 0-1 score
 */
function calculateCharacterSimilarity(char1: string, char2: string): number {
  if (char1 === char2) return 1

  // Check if characters share any of the same characters
  const chars1 = char1.split('')
  const chars2 = char2.split('')

  let sharedChars = 0
  for (const c of chars1) {
    if (chars2.includes(c)) sharedChars++
  }

  return sharedChars / Math.max(chars1.length, chars2.length)
}

/**
 * Find root cause radicals - radicals that appear in multiple leech items
 */
export function findRootCauseRadicals(
  leeches: LeechItem[],
  subjects: (Subject & { id: number })[]
): RootCauseRadical[] {
  // Create subject lookup
  const subjectMap = new Map<number, Subject & { id: number }>()
  subjects.forEach((subject) => {
    subjectMap.set(subject.id, subject)
  })

  // Count radical occurrences in leech items
  const radicalCounts = new Map<number, { count: number; items: LeechItem[] }>()

  for (const leech of leeches) {
    const subject = subjectMap.get(leech.subjectId)
    if (!subject || !('component_subject_ids' in subject)) continue

    // For kanji and vocabulary, check component radicals
    const componentIds = subject.component_subject_ids

    for (const componentId of componentIds) {
      const component = subjectMap.get(componentId)
      if (component && 'character_images' in component) {
        // This is a radical
        if (!radicalCounts.has(componentId)) {
          radicalCounts.set(componentId, { count: 0, items: [] })
        }
        const entry = radicalCounts.get(componentId)!
        entry.count++
        entry.items.push(leech)
      }
    }
  }

  // Convert to array and filter for radicals affecting multiple items
  const rootCauses: RootCauseRadical[] = []

  radicalCounts.forEach((data, radicalId) => {
    if (data.count >= 3) {
      // At least 3 affected items
      const radical = subjectMap.get(radicalId)
      if (radical && 'character_images' in radical) {
        const character = radical.characters || '?'
        const name = radical.meanings.find((m) => m.primary)?.meaning || 'Unknown'

        rootCauses.push({
          radical: character,
          radicalId,
          name,
          affectedCount: data.count,
          affectedItems: data.items,
        })
      }
    }
  })

  return rootCauses.sort((a, b) => b.affectedCount - a.affectedCount)
}
