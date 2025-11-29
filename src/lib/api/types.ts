// WaniKani API v2 TypeScript Types
// Base URL: https://api.wanikani.com/v2/

// ============================================================================
// Generic Collection Wrapper (Pagination)
// ============================================================================

export interface Collection<T> {
  object: 'collection'
  url: string
  pages: {
    next_url: string | null
    previous_url: string | null
    per_page: number
  }
  total_count: number
  data_updated_at: string | null
  data: Resource<T>[]
}

export interface Resource<T> {
  id: number
  object: string
  url: string
  data_updated_at: string
  data: T
}

// ============================================================================
// User
// ============================================================================

export interface User {
  id: string
  username: string
  level: number
  profile_url: string
  started_at: string
  current_vacation_started_at: string | null
  subscription: {
    active: boolean
    type: 'free' | 'recurring' | 'lifetime'
    max_level_granted: number
    period_ends_at: string | null
  }
  preferences: {
    default_voice_actor_id: number
    lessons_autoplay_audio: boolean
    lessons_batch_size: number
    lessons_presentation_order: string
    reviews_autoplay_audio: boolean
    reviews_display_srs_indicator: boolean
  }
}

// ============================================================================
// Assignment
// ============================================================================

export interface Assignment {
  created_at: string
  subject_id: number
  subject_type: 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary'
  srs_stage: number // 0-9 (0=initiate, 1-4=apprentice, 5-6=guru, 7=master, 8=enlightened, 9=burned)
  srs_stage_name: string
  unlocked_at: string | null
  started_at: string | null
  passed_at: string | null
  burned_at: string | null
  available_at: string | null
  resurrected_at: string | null
  passed: boolean
  resurrected: boolean
  hidden: boolean
}

// ============================================================================
// Subject (Radicals, Kanji, Vocabulary)
// ============================================================================

export interface BaseSubject {
  auxiliary_meanings: Array<{
    meaning: string
    type: 'whitelist' | 'blacklist'
  }>
  created_at: string
  document_url: string
  hidden_at: string | null
  lesson_position: number
  level: number
  meaning_mnemonic: string
  meanings: Array<{
    meaning: string
    primary: boolean
    accepted_answer: boolean
  }>
  slug: string
  spaced_repetition_system_id: number
}

export interface RadicalSubject extends BaseSubject {
  amalgamation_subject_ids: number[]
  characters: string | null
  character_images: Array<{
    url: string
    content_type: string
    metadata: {
      inline_styles?: boolean
      color?: string
      dimensions?: string
      style_name?: string
    }
  }>
}

export interface KanjiSubject extends BaseSubject {
  amalgamation_subject_ids: number[]
  characters: string
  component_subject_ids: number[]
  meaning_hint: string | null
  reading_mnemonic: string
  reading_hint: string | null
  readings: Array<{
    reading: string
    primary: boolean
    accepted_answer: boolean
    type: 'onyomi' | 'kunyomi' | 'nanori'
  }>
  visually_similar_subject_ids: number[]
}

export interface VocabularySubject extends BaseSubject {
  characters: string
  component_subject_ids: number[]
  context_sentences: Array<{
    en: string
    ja: string
  }>
  parts_of_speech: string[]
  pronunciation_audios: Array<{
    url: string
    content_type: string
    metadata: {
      gender: string
      source_id: number
      pronunciation: string
      voice_actor_id: number
      voice_actor_name: string
      voice_description: string
    }
  }>
  readings: Array<{
    reading: string
    primary: boolean
    accepted_answer: boolean
  }>
  reading_mnemonic: string
}

export type Subject = RadicalSubject | KanjiSubject | VocabularySubject

// ============================================================================
// Level Progression
// ============================================================================

export interface LevelProgression {
  created_at: string
  level: number
  unlocked_at: string | null
  started_at: string | null
  passed_at: string | null
  completed_at: string | null
  abandoned_at: string | null
}

// ============================================================================
// Review
// ============================================================================

export interface Review {
  created_at: string // When the review was completed
  assignment_id: number
  spaced_repetition_system_id: number
  subject_id: number
  starting_srs_stage: number
  ending_srs_stage: number
  incorrect_meaning_answers: number
  incorrect_reading_answers: number
}

// ============================================================================
// Review Statistic
// ============================================================================

export interface ReviewStatistic {
  created_at: string
  subject_id: number
  subject_type: 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary'
  meaning_correct: number
  meaning_incorrect: number
  meaning_max_streak: number
  meaning_current_streak: number
  reading_correct: number
  reading_incorrect: number
  reading_max_streak: number
  reading_current_streak: number
  percentage_correct: number
  hidden: boolean
}

// ============================================================================
// Summary
// ============================================================================

export interface Summary {
  lessons: Array<{
    available_at: string
    subject_ids: number[]
  }>
  next_reviews_at: string | null
  reviews: Array<{
    available_at: string
    subject_ids: number[]
  }>
}

// ============================================================================
// API Error Response
// ============================================================================

export interface APIError {
  error: string
  code: number
}

// ============================================================================
// Helper Types
// ============================================================================

export type SRSStage =
  | 'initiate'
  | 'apprentice'
  | 'guru'
  | 'master'
  | 'enlightened'
  | 'burned'

export interface SRSDistribution {
  apprentice: number
  guru: number
  master: number
  enlightened: number
  burned: number
}

// Map numeric SRS stage to stage name
export function getSRSStageName(stage: number): SRSStage {
  if (stage === 0) return 'initiate'
  if (stage >= 1 && stage <= 4) return 'apprentice'
  if (stage >= 5 && stage <= 6) return 'guru'
  if (stage === 7) return 'master'
  if (stage === 8) return 'enlightened'
  if (stage === 9) return 'burned'
  return 'initiate'
}
