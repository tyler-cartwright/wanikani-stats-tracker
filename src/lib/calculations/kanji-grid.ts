import type { Subject, Assignment, SRSStage, KanjiSubject, RadicalSubject, VocabularySubject } from '@/lib/api/types'

// ============================================================================
// Types
// ============================================================================

export type SubjectType = 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary'

export interface EnrichedSubject {
  id: number
  character: string | null
  characterImageUrl: string | null
  level: number
  primaryMeaning: string
  primaryReading: string | null
  readingType: 'onyomi' | 'kunyomi' | 'nanori' | null
  srsStage: number // 0-9
  srsStageName: SRSStage
  subjectType: SubjectType
  documentUrl: string
  hidden_at: string | null // WaniKani curriculum removal timestamp
}

export interface SubjectsByLevel {
  level: number
  subjects: EnrichedSubject[]
  stats: {
    total: number
    locked: number
    apprentice: number
    guru: number
    master: number
    enlightened: number
    burned: number
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert numeric SRS stage (0-9) to named stage
 */
export function getSRSStageName(stage: number): SRSStage {
  if (stage === 0) return 'initiate'
  if (stage >= 1 && stage <= 4) return 'apprentice'
  if (stage >= 5 && stage <= 6) return 'guru'
  if (stage === 7) return 'master'
  if (stage === 8) return 'enlightened'
  if (stage === 9) return 'burned'
  return 'initiate' // Fallback
}

/**
 * Determine subject type
 */
function getSubjectType(subject: Subject): SubjectType {
  if ('character_images' in subject) return 'radical'
  if ('readings' in subject && 'type' in (subject.readings[0] || {})) return 'kanji'
  return 'vocabulary'
}

/**
 * Check if a subject is a radical
 */
function isRadical(subject: Subject): subject is RadicalSubject {
  return 'character_images' in subject
}

/**
 * Choose the best-renderable radical image.
 * Prefer inline-styled SVGs (self-colored, invert-friendly), fall back to any SVG, then first image.
 */
function getRadicalImageUrl(subject: RadicalSubject): string | null {
  if (!subject.character_images || subject.character_images.length === 0) {
    return null
  }

  const inlineSvg = subject.character_images.find(
    (img) => img.content_type === 'image/svg+xml' && img.metadata?.inline_styles
  )
  if (inlineSvg) return inlineSvg.url

  const anySvg = subject.character_images.find((img) => img.content_type === 'image/svg+xml')
  if (anySvg) return anySvg.url

  return subject.character_images[0]?.url ?? null
}

/**
 * Check if a subject is a kanji
 */
function isKanji(subject: Subject): subject is KanjiSubject {
  return (
    'readings' in subject &&
    Array.isArray(subject.readings) &&
    subject.readings.length > 0 &&
    'type' in subject.readings[0]
  )
}

/**
 * Check if a subject is vocabulary
 */
function isVocabulary(subject: Subject): subject is VocabularySubject {
  return 'context_sentences' in subject && 'parts_of_speech' in subject
}

/**
 * Extract primary reading from kanji
 */
function getKanjiReading(kanji: KanjiSubject): { reading: string; type: 'onyomi' | 'kunyomi' | 'nanori' } {
  if (!kanji.readings || kanji.readings.length === 0) {
    return { reading: '', type: 'onyomi' }
  }
  const primaryReading = kanji.readings.find((r) => r.primary)
  if (primaryReading) {
    return { reading: primaryReading.reading, type: primaryReading.type }
  }
  // Fallback to first reading
  const firstReading = kanji.readings[0]
  return firstReading
    ? { reading: firstReading.reading, type: firstReading.type }
    : { reading: '', type: 'onyomi' }
}

/**
 * Extract primary reading from vocabulary
 */
function getVocabularyReading(vocab: VocabularySubject): string {
  if (!vocab.readings || vocab.readings.length === 0) return ''
  const primaryReading = vocab.readings.find((r) => r.primary)
  return primaryReading?.reading ?? vocab.readings[0]?.reading ?? ''
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Enrich subjects with SRS data from assignments
 */
export function enrichSubjectsWithSRS(
  subjects: (Subject & { id: number })[],
  assignments: Assignment[]
): EnrichedSubject[] {
  // Create assignment lookup map
  const assignmentMap = new Map<number, Assignment>()
  assignments.forEach((assignment) => {
    assignmentMap.set(assignment.subject_id, assignment)
  })

  // Process all subjects
  const enrichedSubjects: EnrichedSubject[] = []

  subjects.forEach((subject) => {
    const assignment = assignmentMap.get(subject.id)
    const srsStage = assignment?.srs_stage ?? 0
    const primaryMeaning = subject.meanings.find((m) => m.primary)?.meaning ?? subject.meanings[0]?.meaning ?? ''
    const subjectType = getSubjectType(subject)

    let character: string | null = null
    let characterImageUrl: string | null = null
    let primaryReading: string | null = null
    let readingType: 'onyomi' | 'kunyomi' | 'nanori' | null = null

    if (isRadical(subject)) {
      character = subject.characters
      characterImageUrl = getRadicalImageUrl(subject)
      primaryReading = null
      readingType = null
    } else if (isKanji(subject)) {
      character = subject.characters
      characterImageUrl = null
      const reading = getKanjiReading(subject)
      primaryReading = reading.reading
      readingType = reading.type
    } else if (isVocabulary(subject)) {
      character = subject.characters
      characterImageUrl = null
      primaryReading = getVocabularyReading(subject)
      readingType = null
    }

    enrichedSubjects.push({
      id: subject.id,
      character,
      characterImageUrl,
      level: subject.level,
      primaryMeaning,
      primaryReading,
      readingType,
      srsStage,
      srsStageName: getSRSStageName(srsStage),
      subjectType,
      documentUrl: subject.document_url,
      hidden_at: subject.hidden_at,
    })
  })

  // Sort by level, then by id
  enrichedSubjects.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return a.id - b.id
  })

  return enrichedSubjects
}

/**
 * Filter subjects by various criteria
 */
export function filterSubjects(
  subjects: EnrichedSubject[],
  filters: {
    levelRange?: [number, number]
    srsStages?: SRSStage[]
    subjectTypes?: SubjectType[]
    searchQuery?: string
  }
): EnrichedSubject[] {
  let filtered = subjects

  // Filter by level range
  if (filters.levelRange) {
    const [min, max] = filters.levelRange
    filtered = filtered.filter((s) => s.level >= min && s.level <= max)
  }

  // Filter by SRS stages
  if (filters.srsStages && filters.srsStages.length > 0) {
    filtered = filtered.filter((s) => filters.srsStages!.includes(s.srsStageName))
  }

  // Filter by subject types
  if (filters.subjectTypes && filters.subjectTypes.length > 0) {
    filtered = filtered.filter((s) => filters.subjectTypes!.includes(s.subjectType))
  }

  // Filter by search query (search in character, meaning, or reading)
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.trim().toLowerCase()
    filtered = filtered.filter((s) => {
      return (
        (s.character && s.character.includes(query)) ||
        s.primaryMeaning.toLowerCase().includes(query) ||
        (s.primaryReading && s.primaryReading.toLowerCase().includes(query))
      )
    })
  }

  return filtered
}

/**
 * Group subjects by level with stats
 */
export function groupSubjectsByLevel(subjects: EnrichedSubject[]): SubjectsByLevel[] {
  const levelMap = new Map<number, EnrichedSubject[]>()

  // Group subjects by level
  subjects.forEach((s) => {
    const levelSubjects = levelMap.get(s.level) ?? []
    levelSubjects.push(s)
    levelMap.set(s.level, levelSubjects)
  })

  // Convert to array with stats
  const grouped: SubjectsByLevel[] = []
  levelMap.forEach((levelSubjects, level) => {
    const stats = {
      total: levelSubjects.length,
      locked: levelSubjects.filter((s) => s.srsStage === 0).length,
      apprentice: levelSubjects.filter((s) => s.srsStage >= 1 && s.srsStage <= 4).length,
      guru: levelSubjects.filter((s) => s.srsStage >= 5 && s.srsStage <= 6).length,
      master: levelSubjects.filter((s) => s.srsStage === 7).length,
      enlightened: levelSubjects.filter((s) => s.srsStage === 8).length,
      burned: levelSubjects.filter((s) => s.srsStage === 9).length,
    }

    grouped.push({
      level,
      subjects: levelSubjects,
      stats,
    })
  })

  // Sort by level
  grouped.sort((a, b) => a.level - b.level)

  return grouped
}

/**
 * Get Tailwind CSS classes for a subject cell based on SRS stage
 */
export function getSRSCellClasses(srsStage: number): string {
  switch (srsStage) {
    case 0:
      return 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-400'
    case 1:
      return 'bg-srs-apprentice/40 text-ink-100 dark:text-paper-100'
    case 2:
      return 'bg-srs-apprentice/60 text-ink-100 dark:text-paper-100'
    case 3:
      return 'bg-srs-apprentice/80 text-ink-100 dark:text-paper-100'
    case 4:
      return 'bg-srs-apprentice text-ink-100 dark:text-paper-100'
    case 5:
      return 'bg-srs-guru/80 text-ink-100 dark:text-paper-100'
    case 6:
      return 'bg-srs-guru text-ink-100 dark:text-paper-100'
    case 7:
      return 'bg-srs-master text-ink-100 dark:text-paper-100'
    case 8:
      return 'bg-srs-enlightened text-ink-100 dark:text-paper-100'
    case 9:
      return 'bg-srs-burned text-paper-100'
    default:
      return 'bg-paper-300 dark:bg-ink-300'
  }
}

/**
 * Get subject type color for border/indicator
 */
export function getSubjectTypeColor(subjectType: SubjectType): string {
  switch (subjectType) {
    case 'radical':
      return 'border-t-[#00AAFF]'
    case 'kanji':
      return 'border-t-[#FF00AA]'
    case 'vocabulary':
    case 'kana_vocabulary':
      return 'border-t-[#AA00FF]'
    default:
      return 'border-t-ink-300'
  }
}
