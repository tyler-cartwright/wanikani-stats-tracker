// Exam Readiness Types and Interfaces (Jōyō Kanji System)

// Keep legacy JLPT types for approximation
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

// Jōyō grade levels (Kyōiku Kanji + Secondary School)
export type JoyoGrade = 'grade_1' | 'grade_2' | 'grade_3' | 'grade_4' | 'grade_5' | 'grade_6' | 'secondary'

export type SRSThreshold =
  | 'apprentice_4' // SRS stage 4+
  | 'guru' // SRS stage 5+ (default)
  | 'master' // SRS stage 7+
  | 'enlightened' // SRS stage 8+
  | 'burned' // SRS stage 9

export interface JoyoLevelData {
  grade: JoyoGrade
  label: string // "Grade 1", "Grade 2", "Secondary School"
  ageRange: string // "Age 6-7", "Age 12-18"
  kanji: {
    total: number
    known: number
    inWanikani: number
    percentage: number
  }
  isComplete: boolean // >= 90%
}

export interface JoyoItem {
  character: string
  wanikaniId: number | null // null if not in WaniKani
  srsStage: number
  isKnown: boolean // Based on threshold
  meaning?: string
  reading?: string
}

export interface JoyoReadinessResult {
  currentGrade: JoyoGrade | null // Highest grade at 90%+ completion
  grades: JoyoLevelData[]
  frequencyCoverage: number // Percentage of common kanji you can read
  approximateJlpt: JLPTLevel | null // Rough JLPT equivalent (with disclaimer)
  threshold: SRSThreshold
  totalKanjiKnown: number
  totalKanjiInWanikani: number
}

export const JOYO_GRADES: JoyoGrade[] = ['grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'secondary']

export const JOYO_GRADE_INFO: Record<JoyoGrade, { label: string; ageRange: string }> = {
  grade_1: { label: 'Grade 1', ageRange: 'Age 6-7' },
  grade_2: { label: 'Grade 2', ageRange: 'Age 7-8' },
  grade_3: { label: 'Grade 3', ageRange: 'Age 8-9' },
  grade_4: { label: 'Grade 4', ageRange: 'Age 9-10' },
  grade_5: { label: 'Grade 5', ageRange: 'Age 10-11' },
  grade_6: { label: 'Grade 6', ageRange: 'Age 11-12' },
  secondary: { label: 'Secondary School', ageRange: 'Age 12-18' },
}

export const SRS_THRESHOLD_LABELS: Record<SRSThreshold, string> = {
  apprentice_4: 'Apprentice 4+',
  guru: 'Guru+',
  master: 'Master+',
  enlightened: 'Enlightened+',
  burned: 'Burned Only',
}

export const SRS_THRESHOLD_DESCRIPTIONS: Record<SRSThreshold, string> = {
  apprentice_4: 'Items at Apprentice 4 or higher (more lenient)',
  guru: 'Items that have been passed to Guru or higher (recommended)',
  master: 'Items at Master stage or higher (strict)',
  enlightened: 'Items at Enlightened or higher (very strict)',
  burned: 'Only fully mastered items (strictest)',
}
