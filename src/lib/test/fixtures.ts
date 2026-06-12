// Test fixture builders for WaniKani API resources.
// Each builder returns a fully-populated object with sensible defaults;
// pass overrides for the fields a scenario cares about.
import type {
  Assignment,
  KanjiSubject,
  LevelProgression,
  RadicalSubject,
  Reset,
  ReviewStatistic,
  Subject,
} from '@/lib/api/types'
import type { ActivityDayRow } from '@/lib/db/schema'

export function makeReset(overrides: Partial<Reset> = {}): Reset {
  return {
    created_at: '2025-01-01T00:00:00.000000Z',
    original_level: 10,
    target_level: 1,
    confirmed_at: '2025-01-01T00:00:00.000000Z',
    ...overrides,
  }
}

export function makeLevelProgression(
  overrides: Partial<LevelProgression> = {}
): LevelProgression {
  return {
    created_at: '2025-02-01T00:00:00.000000Z',
    level: 1,
    unlocked_at: '2025-02-01T00:00:00.000000Z',
    started_at: '2025-02-01T00:00:00.000000Z',
    passed_at: null,
    completed_at: null,
    abandoned_at: null,
    ...overrides,
  }
}

export function makeReviewStatistic(
  overrides: Partial<ReviewStatistic> = {}
): ReviewStatistic {
  return {
    created_at: '2025-02-01T00:00:00.000000Z',
    subject_id: 1,
    subject_type: 'kanji',
    meaning_correct: 0,
    meaning_incorrect: 0,
    meaning_max_streak: 0,
    meaning_current_streak: 0,
    reading_correct: 0,
    reading_incorrect: 0,
    reading_max_streak: 0,
    reading_current_streak: 0,
    percentage_correct: 0,
    hidden: false,
    ...overrides,
  }
}

export function makeSubject(
  overrides: Partial<KanjiSubject & { id: number }> = {}
): Subject & { id: number } {
  return {
    id: 1,
    auxiliary_meanings: [],
    created_at: '2025-01-01T00:00:00.000000Z',
    document_url: 'https://www.wanikani.com/kanji/example',
    hidden_at: null,
    lesson_position: 0,
    level: 1,
    meaning_mnemonic: '',
    meanings: [{ meaning: 'Example', primary: true, accepted_answer: true }],
    slug: 'example',
    spaced_repetition_system_id: 1,
    amalgamation_subject_ids: [],
    characters: '例',
    component_subject_ids: [],
    meaning_hint: null,
    reading_mnemonic: '',
    reading_hint: null,
    readings: [
      { reading: 'れい', primary: true, accepted_answer: true, type: 'onyomi' },
    ],
    visually_similar_subject_ids: [],
    ...overrides,
  }
}

// The presence of character_images (even empty) is what marks a radical
export function makeRadicalSubject(
  overrides: Partial<RadicalSubject & { id: number }> = {}
): Subject & { id: number } {
  return {
    id: 1,
    auxiliary_meanings: [],
    created_at: '2025-01-01T00:00:00.000000Z',
    document_url: 'https://www.wanikani.com/radicals/example',
    hidden_at: null,
    lesson_position: 0,
    level: 1,
    meaning_mnemonic: '',
    meanings: [{ meaning: 'Leader', primary: true, accepted_answer: true }],
    slug: 'leader',
    spaced_repetition_system_id: 1,
    amalgamation_subject_ids: [],
    characters: '亻',
    character_images: [],
    ...overrides,
  }
}

// reviews may be overridden facet-by-facet; unspecified facets keep defaults
type ActivityDayRowOverrides = Partial<Omit<ActivityDayRow, 'reviews'>> & {
  reviews?: Partial<ActivityDayRow['reviews']>
}

export function makeActivityDayRow(
  overrides: ActivityDayRowOverrides = {}
): ActivityDayRow {
  const { reviews, ...rest } = overrides
  return {
    date: '2026-06-01',
    lessons: 5,
    srsSnapshot: null,
    updatedAt: '2026-06-01T12:00:00.000Z',
    ...rest,
    reviews: {
      meaningCorrect: 10,
      meaningIncorrect: 2,
      readingCorrect: 9,
      readingIncorrect: 3,
      ...reviews,
    },
  }
}

export function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    created_at: '2025-02-01T00:00:00.000000Z',
    subject_id: 1,
    subject_type: 'kanji',
    srs_stage: 1,
    srs_stage_name: 'Apprentice I',
    unlocked_at: '2025-02-01T00:00:00.000000Z',
    started_at: '2025-02-01T00:00:00.000000Z',
    passed_at: null,
    burned_at: null,
    available_at: '2025-02-02T00:00:00.000000Z',
    resurrected_at: null,
    passed: false,
    resurrected: false,
    hidden: false,
    ...overrides,
  }
}
