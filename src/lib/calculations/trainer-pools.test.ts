import { describe, expect, it } from 'vitest'
import {
  buildConfusionPairPool,
  buildCurrentLevelPool,
  buildLeechPool,
  buildRecentlyFailedPool,
  pickAudioUrl,
  toDetailItem,
  type StatRow,
} from './trainer-pools'
import {
  makeAssignment,
  makeRadicalSubject,
  makeReviewStatistic,
  makeSubject,
} from '@/lib/test/fixtures'
import type { Subject, VocabularySubject } from '@/lib/api/types'

const NOW = new Date('2026-06-12T12:00:00.000Z')

function makeVocabSubject(
  overrides: Partial<VocabularySubject & { id: number }> = {}
): Subject & { id: number } {
  return {
    id: 1,
    auxiliary_meanings: [],
    created_at: '2025-01-01T00:00:00.000000Z',
    document_url: 'https://www.wanikani.com/vocabulary/example',
    hidden_at: null,
    lesson_position: 0,
    level: 1,
    meaning_mnemonic: '',
    meanings: [{ meaning: 'Fish', primary: true, accepted_answer: true }],
    slug: 'fish',
    spaced_repetition_system_id: 1,
    characters: '魚',
    component_subject_ids: [],
    context_sentences: [],
    parts_of_speech: ['noun'],
    pronunciation_audios: [],
    readings: [{ reading: 'さかな', primary: true, accepted_answer: true }],
    reading_mnemonic: '',
    ...overrides,
  }
}

function makeAudio(url: string, contentType: string) {
  return {
    url,
    content_type: contentType,
    metadata: {
      gender: 'female',
      source_id: 1,
      pronunciation: 'さかな',
      voice_actor_id: 1,
      voice_actor_name: 'Kyoko',
      voice_description: 'Tokyo accent',
    },
  }
}

// A review stat that qualifies as a leech under the default thresholds
function leechStat(subjectId: number) {
  return makeReviewStatistic({
    subject_id: subjectId,
    meaning_correct: 5,
    meaning_incorrect: 5,
    reading_correct: 5,
    reading_incorrect: 5,
    percentage_correct: 50,
  })
}

describe('pickAudioUrl — pronunciation selection', () => {
  it('prefers audio/mpeg over other content types', () => {
    const subject = makeVocabSubject({
      pronunciation_audios: [
        makeAudio('https://files.wanikani.com/a.ogg', 'audio/ogg'),
        makeAudio('https://files.wanikani.com/a.mp3', 'audio/mpeg'),
      ],
    })
    expect(pickAudioUrl(subject)).toBe('https://files.wanikani.com/a.mp3')
  })

  it('falls back to the first entry when no mpeg exists', () => {
    const subject = makeVocabSubject({
      pronunciation_audios: [
        makeAudio('https://files.wanikani.com/a.ogg', 'audio/ogg'),
        makeAudio('https://files.wanikani.com/b.webm', 'audio/webm'),
      ],
    })
    expect(pickAudioUrl(subject)).toBe('https://files.wanikani.com/a.ogg')
  })

  it('returns null for vocab without audio, kanji, and radicals', () => {
    expect(pickAudioUrl(makeVocabSubject({ pronunciation_audios: [] }))).toBeNull()
    expect(pickAudioUrl(makeSubject())).toBeNull()
    expect(pickAudioUrl(makeRadicalSubject())).toBeNull()
  })
})

describe('buildLeechPool — leech cards', () => {
  it('maps detected leeches to cards, preserving severity order', () => {
    const subjects = [
      makeSubject({ id: 1, characters: '人' }),
      makeSubject({ id: 2, characters: '魚' }),
    ]
    const stats = [
      leechStat(1),
      makeReviewStatistic({
        subject_id: 2,
        meaning_correct: 2,
        meaning_incorrect: 18,
        reading_correct: 2,
        reading_incorrect: 18,
        percentage_correct: 10,
      }),
    ]
    const assignments = [
      makeAssignment({ subject_id: 1 }),
      makeAssignment({ subject_id: 2 }),
    ]

    const pool = buildLeechPool(stats, subjects, assignments)

    expect(pool.map((c) => c.subjectId)).toEqual([2, 1]) // worst first
    expect(pool[0].character).toBe('魚')
    expect(pool[0].totalReviews).toBe(40)
  })

  it('attaches audio for vocabulary leeches', () => {
    const subject = makeVocabSubject({
      id: 7,
      pronunciation_audios: [makeAudio('https://files.wanikani.com/a.mp3', 'audio/mpeg')],
    })
    const stat = { ...leechStat(7), subject_type: 'vocabulary' as const }

    const pool = buildLeechPool([stat], [subject], [makeAssignment({ subject_id: 7 })])

    expect(pool).toHaveLength(1)
    expect(pool[0].audioUrl).toBe('https://files.wanikani.com/a.mp3')
  })
})

describe('buildRecentlyFailedPool — recent-miss detection', () => {
  function row(overrides: Partial<StatRow['stat']> = {}, updatedAt = '2026-06-10T00:00:00.000Z'): StatRow {
    return {
      stat: makeReviewStatistic({
        subject_id: 1,
        meaning_correct: 4,
        meaning_incorrect: 2,
        meaning_current_streak: 0,
        reading_correct: 5,
        reading_incorrect: 1,
        reading_current_streak: 3,
        ...overrides,
      }),
      updatedAt,
    }
  }
  const subjects = [makeSubject({ id: 1 })]
  const assignments = [makeAssignment({ subject_id: 1 })]

  it('includes an item whose meaning facet has a miss and streak <= 1', () => {
    const pool = buildRecentlyFailedPool([row()], subjects, assignments, { now: NOW })
    expect(pool.map((c) => c.subjectId)).toEqual([1])
  })

  it('includes via the reading facet alone', () => {
    const pool = buildRecentlyFailedPool(
      [row({ meaning_current_streak: 5, reading_current_streak: 1 })],
      subjects,
      assignments,
      { now: NOW }
    )
    expect(pool).toHaveLength(1)
  })

  it('excludes items whose streaks have recovered past 1', () => {
    const pool = buildRecentlyFailedPool(
      [row({ meaning_current_streak: 2, reading_current_streak: 2 })],
      subjects,
      assignments,
      { now: NOW }
    )
    expect(pool).toEqual([])
  })

  it('excludes new items that have never missed (streak 1, zero incorrect)', () => {
    const pool = buildRecentlyFailedPool(
      [
        row({
          meaning_correct: 1,
          meaning_incorrect: 0,
          meaning_current_streak: 1,
          reading_correct: 1,
          reading_incorrect: 0,
          reading_current_streak: 1,
        }),
      ],
      subjects,
      assignments,
      { now: NOW }
    )
    expect(pool).toEqual([])
  })

  it('does not auto-include radicals via their empty reading facet', () => {
    const radical = makeRadicalSubject({ id: 9 })
    const statRow = row({
      subject_id: 9,
      subject_type: 'radical',
      meaning_correct: 6,
      meaning_incorrect: 1,
      meaning_current_streak: 4, // healthy meaning facet
      reading_correct: 0,
      reading_incorrect: 0,
      reading_current_streak: 0, // empty facet, must not qualify
    })
    const pool = buildRecentlyFailedPool(
      [statRow],
      [radical],
      [makeAssignment({ subject_id: 9, subject_type: 'radical' })],
      { now: NOW }
    )
    expect(pool).toEqual([])
  })

  it('includes a row exactly at the window boundary and excludes one just past it', () => {
    const exactlySevenDays = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const justOver = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000 - 1).toISOString()

    expect(
      buildRecentlyFailedPool([row({}, exactlySevenDays)], subjects, assignments, { now: NOW })
    ).toHaveLength(1)
    expect(
      buildRecentlyFailedPool([row({}, justOver)], subjects, assignments, { now: NOW })
    ).toEqual([])
  })

  it('excludes hidden stats, hidden/unstarted/burned/missing assignments, and hidden subjects', () => {
    const cases: Array<{ statRow: StatRow; subjects: typeof subjects; assignments: ReturnType<typeof makeAssignment>[] }> = [
      { statRow: row({ hidden: true }), subjects, assignments },
      { statRow: row(), subjects: [makeSubject({ id: 1, hidden_at: '2026-01-01T00:00:00Z' })], assignments },
      { statRow: row(), subjects, assignments: [makeAssignment({ subject_id: 1, started_at: null })] },
      { statRow: row(), subjects, assignments: [makeAssignment({ subject_id: 1, hidden: true })] },
      { statRow: row(), subjects, assignments: [makeAssignment({ subject_id: 1, srs_stage: 9 })] },
      { statRow: row(), subjects, assignments: [] },
    ]
    for (const c of cases) {
      expect(buildRecentlyFailedPool([c.statRow], c.subjects, c.assignments, { now: NOW })).toEqual([])
    }
  })

  it('orders by most recently updated first', () => {
    const rows = [
      { ...row({ subject_id: 1 }), updatedAt: '2026-06-08T00:00:00.000Z' },
      { ...row({ subject_id: 2 }), updatedAt: '2026-06-11T00:00:00.000Z' },
    ]
    const pool = buildRecentlyFailedPool(
      rows,
      [makeSubject({ id: 1 }), makeSubject({ id: 2 })],
      [makeAssignment({ subject_id: 1 }), makeAssignment({ subject_id: 2 })],
      { now: NOW }
    )
    expect(pool.map((c) => c.subjectId)).toEqual([2, 1])
  })
})

describe('buildCurrentLevelPool — level scoping', () => {
  it('includes only started, non-hidden items at the given level, in lesson order', () => {
    const subjects = [
      makeSubject({ id: 1, level: 5, lesson_position: 2 }),
      makeSubject({ id: 2, level: 5, lesson_position: 1 }),
      makeSubject({ id: 3, level: 4, lesson_position: 0 }), // wrong level
      makeSubject({ id: 4, level: 5, lesson_position: 3 }), // unstarted
      makeSubject({ id: 5, level: 5, lesson_position: 4, hidden_at: '2026-01-01T00:00:00Z' }),
      makeSubject({ id: 6, level: 5, lesson_position: 5 }), // no assignment
    ]
    const assignments = [
      makeAssignment({ subject_id: 1 }),
      makeAssignment({ subject_id: 2 }),
      makeAssignment({ subject_id: 3 }),
      makeAssignment({ subject_id: 4, started_at: null }),
      makeAssignment({ subject_id: 5 }),
    ]

    const pool = buildCurrentLevelPool(subjects, assignments, 5)

    expect(pool.map((c) => c.subjectId)).toEqual([2, 1])
  })

  it('zeroes stats for never-reviewed items and fills them when stats exist', () => {
    const subjects = [
      makeSubject({ id: 1, level: 5 }),
      makeSubject({ id: 2, level: 5, lesson_position: 1 }),
    ]
    const assignments = [
      makeAssignment({ subject_id: 1 }),
      makeAssignment({ subject_id: 2, srs_stage: 4 }),
    ]
    const stats = [
      makeReviewStatistic({
        subject_id: 2,
        meaning_correct: 8,
        meaning_incorrect: 2,
        reading_correct: 9,
        reading_incorrect: 1,
        percentage_correct: 85,
      }),
    ]

    const pool = buildCurrentLevelPool(subjects, assignments, 5, stats)

    const fresh = pool.find((c) => c.subjectId === 1)!
    expect(fresh.totalReviews).toBe(0)
    expect(fresh.accuracy).toBe(0)

    const reviewed = pool.find((c) => c.subjectId === 2)!
    expect(reviewed.totalReviews).toBe(20)
    expect(reviewed.accuracy).toBe(85)
    expect(reviewed.meaningAccuracy).toBe(80)
    expect(reviewed.currentSRS).toBe(4)
  })

  it('builds radical cards with empty readings and no audio', () => {
    const radical = makeRadicalSubject({ id: 9, level: 5 })
    const pool = buildCurrentLevelPool(
      [radical],
      [makeAssignment({ subject_id: 9, subject_type: 'radical' })],
      5
    )

    expect(pool).toHaveLength(1)
    expect(pool[0].type).toBe('radical')
    expect(pool[0].readings.primary).toBeNull()
    expect(pool[0].readings.vocabulary).toEqual([])
    expect(pool[0].audioUrl).toBeNull()
  })
})

describe('buildConfusionPairPool — visually-similar deck', () => {
  // Similarity is shared characters / max length and must exceed 0.5, so
  // these three-character words sharing 人工 (2/3) qualify as a pair
  const subjects = [
    makeVocabSubject({ id: 1, characters: '人工的' }),
    makeVocabSubject({ id: 2, characters: '人工林' }),
    makeVocabSubject({ id: 3, characters: '無関係' }),
  ]
  const vocabStat = (id: number) => ({ ...leechStat(id), subject_type: 'vocabulary' as const })
  const assignments = [
    makeAssignment({ subject_id: 1 }),
    makeAssignment({ subject_id: 2 }),
    makeAssignment({ subject_id: 3 }),
  ]

  it('produces symmetric cards for each member of a pair', () => {
    const pool = buildConfusionPairPool(
      [vocabStat(1), vocabStat(2), vocabStat(3)],
      subjects,
      assignments
    )

    expect(pool.map((c) => c.subjectId).sort()).toEqual([1, 2])
    const card1 = pool.find((c) => c.subjectId === 1)!
    const card2 = pool.find((c) => c.subjectId === 2)!
    expect(card1.contrastSubjectId).toBe(2)
    expect(card2.contrastSubjectId).toBe(1)
  })

  it('returns an empty pool when no leeches are confusable', () => {
    const pool = buildConfusionPairPool([vocabStat(3)], subjects, assignments)
    expect(pool).toEqual([])
  })

  it('dedupes an item in multiple pairs, keeping its highest-similarity contrast', () => {
    // 人口 vs 人工 share 1/2 chars (0.5 is not > 0.5)... use overlapping triples:
    // A=人工的 B=人工 C=工的 — A/B share 2/3, A/C share 2/3, B/C share 1/3
    const tri = [
      makeVocabSubject({ id: 11, characters: '人工的' }),
      makeVocabSubject({ id: 12, characters: '人工林' }),
      makeVocabSubject({ id: 13, characters: '的中' }),
    ]
    const triAssignments = [
      makeAssignment({ subject_id: 11 }),
      makeAssignment({ subject_id: 12 }),
      makeAssignment({ subject_id: 13 }),
    ]
    const pool = buildConfusionPairPool(
      [vocabStat(11), vocabStat(12), vocabStat(13)],
      tri,
      triAssignments
    )

    // 11/12 share 人工 (similarity 2/3); 11/13 share 的 (1/3, below threshold)
    const card11 = pool.find((c) => c.subjectId === 11)!
    expect(card11.contrastSubjectId).toBe(12)
    expect(pool.filter((c) => c.subjectId === 11)).toHaveLength(1)
  })
})

describe('toDetailItem — drilldown adapter', () => {
  it('round-trips the fields ItemDetailContent renders', () => {
    const pool = buildCurrentLevelPool(
      [makeSubject({ id: 1, level: 5 })],
      [makeAssignment({ subject_id: 1, srs_stage: 3 })],
      5,
      [
        makeReviewStatistic({
          subject_id: 1,
          meaning_correct: 8,
          meaning_incorrect: 2,
          reading_correct: 9,
          reading_incorrect: 1,
          percentage_correct: 85,
        }),
      ]
    )
    const item = toDetailItem(pool[0])

    expect(item.subjectId).toBe(1)
    expect(item.character).toBe('例')
    expect(item.meaning).toBe('Example')
    expect(item.type).toBe('kanji')
    expect(item.level).toBe(5)
    expect(item.currentSRS).toBe(3)
    expect(item.accuracy).toBe(85)
    expect(item.meaningAccuracy).toBe(80)
    expect(item.readingAccuracy).toBe(90)
    expect(item.totalReviews).toBe(20)
    expect(item.allMeanings).toEqual(['Example'])
    expect(item.readings.primary).toBe('れい')
    expect(item.documentUrl).toBe('https://www.wanikani.com/kanji/example')
  })
})
