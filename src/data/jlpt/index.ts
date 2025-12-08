// Exam Readiness Data Exports (Jōyō Kanji System)
import joyoKanjiData from './joyo-kanji.json'

export * from './types'
export type {
  JLPTLevel,
  JoyoGrade,
  SRSThreshold,
  JoyoLevelData,
  JoyoItem,
  JoyoReadinessResult
} from './types'
export {
  JOYO_GRADES,
  JOYO_GRADE_INFO,
  SRS_THRESHOLD_LABELS,
  SRS_THRESHOLD_DESCRIPTIONS
} from './types'

// Jōyō Kanji data organized by grade
export const JOYO_KANJI: Record<string, string[]> = joyoKanjiData

// Get total counts for each grade
export const JOYO_COUNTS = {
  grade_1: JOYO_KANJI.grade_1.length,
  grade_2: JOYO_KANJI.grade_2.length,
  grade_3: JOYO_KANJI.grade_3.length,
  grade_4: JOYO_KANJI.grade_4.length,
  grade_5: JOYO_KANJI.grade_5.length,
  grade_6: JOYO_KANJI.grade_6.length,
  secondary: JOYO_KANJI.secondary.length,
}

// Data source and version
export const JOYO_DATA_VERSION = '2.0.0'
export const JOYO_DATA_LAST_UPDATED = '2025-12-08'
export const JOYO_DATA_SOURCE = 'davidluzgouveia/kanji-data (GitHub)'
