// Knowledge Stability Calculations
import type { Assignment, Subject } from '@/lib/api/types'

export interface AtRiskItem {
  subjectId: number
  character: string | null
  meaning: string
  level: number
  subjectType: 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary'
  currentSrsStage: number
  passedAt: Date
}

export interface TypeBreakdown {
  solid: number
  fragile: number
  total: number
}

export interface KnowledgeStability {
  // Core metrics
  totalPassed: number // Items that ever reached Guru (passed === true)
  solidItems: number // Passed and currently at Guru+ (srs_stage >= 5)
  fragileItems: number // Passed but fell below Guru (srs_stage < 5)
  stabilityRatio: number // solid / totalPassed (0-1)

  // At-risk items list
  atRiskItems: AtRiskItem[]

  // Breakdown by subject type
  byType: {
    radical: TypeBreakdown
    kanji: TypeBreakdown
    vocabulary: TypeBreakdown
  }
}

/**
 * Calculate knowledge stability metrics
 * An item is "passed" if it ever reached Guru (stage 5+)
 * An item is "solid" if it's currently at Guru+ AND was passed
 * An item is "fragile" if it was passed but fell below Guru
 */
export function calculateKnowledgeStability(
  assignments: Assignment[],
  subjects: Array<Subject & { id: number }>
): KnowledgeStability {
  // Initialize counters
  let totalPassed = 0
  let solidItems = 0
  let fragileItems = 0

  const byType = {
    radical: { solid: 0, fragile: 0, total: 0 },
    kanji: { solid: 0, fragile: 0, total: 0 },
    vocabulary: { solid: 0, fragile: 0, total: 0 },
  }

  const fragileAssignments: Assignment[] = []

  // Analyze each assignment
  for (const assignment of assignments) {
    // Skip hidden items and items that were never started
    if (assignment.hidden || !assignment.started_at) continue

    // Only count items that have passed (reached Guru at some point)
    if (!assignment.passed_at) continue

    // Skip burned items (stage 9) - they're permanently stable
    if (assignment.srs_stage === 9) continue

    totalPassed++

    // Determine if currently solid or fragile
    // Solid: Currently at Guru/Master/Enlightened (5-8)
    // Fragile: Currently at Apprentice (1-4) - fell back from Guru
    const isSolid = assignment.srs_stage >= 5 && assignment.srs_stage <= 8
    const isFragile = assignment.srs_stage >= 1 && assignment.srs_stage <= 4

    if (isSolid) {
      solidItems++
    } else if (isFragile) {
      fragileItems++
      fragileAssignments.push(assignment)
    }

    // Count by type (only count radicals, kanji, vocabulary - skip kana_vocabulary for now)
    const subjectType = assignment.subject_type
    if (subjectType === 'radical') {
      byType.radical.total++
      if (isSolid) byType.radical.solid++
      if (isFragile) byType.radical.fragile++
    } else if (subjectType === 'kanji') {
      byType.kanji.total++
      if (isSolid) byType.kanji.solid++
      if (isFragile) byType.kanji.fragile++
    } else if (subjectType === 'vocabulary') {
      byType.vocabulary.total++
      if (isSolid) byType.vocabulary.solid++
      if (isFragile) byType.vocabulary.fragile++
    }
  }

  // Calculate stability ratio (handle division by zero)
  const stabilityRatio = totalPassed > 0 ? solidItems / totalPassed : 1

  // Get detailed info for at-risk (fragile) items
  const atRiskItems = getAtRiskItems(fragileAssignments, subjects)

  return {
    totalPassed,
    solidItems,
    fragileItems,
    stabilityRatio,
    atRiskItems,
    byType,
  }
}

/**
 * Get detailed information for fragile items
 * Sorted by SRS stage (lowest first - most at risk)
 */
function getAtRiskItems(
  fragileAssignments: Assignment[],
  subjects: Array<Subject & { id: number }>
): AtRiskItem[] {
  // Create a map for quick subject lookup
  const subjectMap = new Map<number, Subject & { id: number }>()
  for (const subject of subjects) {
    subjectMap.set(subject.id, subject)
  }

  const atRiskItems: AtRiskItem[] = []

  for (const assignment of fragileAssignments) {
    const subject = subjectMap.get(assignment.subject_id)
    if (!subject || !assignment.passed_at) continue

    // Get character based on subject type
    let character: string | null = null
    if ('characters' in subject && subject.characters) {
      character = subject.characters
    }

    // Get primary meaning
    const primaryMeaning = subject.meanings.find((m) => m.primary)
    const meaning = primaryMeaning ? primaryMeaning.meaning : subject.meanings[0]?.meaning || 'Unknown'

    atRiskItems.push({
      subjectId: subject.id,
      character,
      meaning,
      level: subject.level,
      subjectType: assignment.subject_type,
      currentSrsStage: assignment.srs_stage,
      passedAt: new Date(assignment.passed_at),
    })
  }

  // Sort by SRS stage (lowest first), then by passed_at (oldest first)
  atRiskItems.sort((a, b) => {
    if (a.currentSrsStage !== b.currentSrsStage) {
      return a.currentSrsStage - b.currentSrsStage
    }
    return a.passedAt.getTime() - b.passedAt.getTime()
  })

  return atRiskItems
}
