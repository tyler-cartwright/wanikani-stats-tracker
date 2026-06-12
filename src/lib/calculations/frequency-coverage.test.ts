import { describe, expect, it } from 'vitest'
import { computeFrequencyCoverage } from './frequency-coverage'
import type { EnrichedSubject } from './kanji-grid'
import { getSRSStageName } from '@/lib/api/types'
import type { FrequencyDataset } from '@/data/frequency'

function makeEnriched(character: string, srsStage: number): EnrichedSubject {
  return {
    id: character.charCodeAt(0),
    character,
    characterImageUrl: null,
    level: 1,
    primaryMeaning: 'Example',
    primaryReading: 'れい',
    readingType: 'onyomi',
    srsStage,
    srsStageName: getSRSStageName(srsStage),
    subjectType: 'kanji',
    documentUrl: 'https://www.wanikani.com/kanji/example',
    hidden_at: null,
  }
}

const dataset: FrequencyDataset = {
  total: 100,
  kanji: [
    ['日', 50],
    ['本', 30],
    ['語', 15],
    ['鬱', 5],
  ],
}

const buckets = [
  { label: 'Top 2', size: 2 },
  { label: 'Top 10', size: 10 },
]

describe('computeFrequencyCoverage', () => {
  it('weights coverage by occurrences, not kanji counts', () => {
    // Knowing only the rank-1 kanji covers half of all occurrences
    const result = computeFrequencyCoverage(dataset, buckets, [makeEnriched('日', 5)], 'guru')

    expect(result.coveragePercent).toBe(50)
    expect(result.knownCount).toBe(1)
    expect(result.listedCount).toBe(4)
  })

  it('respects the SRS threshold', () => {
    const subjects = [makeEnriched('日', 5)]

    expect(computeFrequencyCoverage(dataset, buckets, subjects, 'guru').coveragePercent).toBe(50)
    expect(computeFrequencyCoverage(dataset, buckets, subjects, 'master').coveragePercent).toBe(0)
    expect(
      computeFrequencyCoverage(dataset, buckets, [makeEnriched('日', 4)], 'apprentice_4')
        .coveragePercent
    ).toBe(50)
  })

  it('counts non-WaniKani kanji in the denominator but never as known', () => {
    // 日 and 本 in WK (one known), 語 and 鬱 not in WK
    const subjects = [makeEnriched('日', 5), makeEnriched('本', 1)]
    const result = computeFrequencyCoverage(dataset, buckets, subjects, 'guru')

    expect(result.coveragePercent).toBe(50)
    expect(result.inWanikaniCount).toBe(2)
    // Max possible = (50 + 30) / 100
    expect(result.maxPossiblePercent).toBe(80)
  })

  it('ignores non-kanji subjects sharing a character', () => {
    const vocab = { ...makeEnriched('日', 9), subjectType: 'vocabulary' as const }
    const result = computeFrequencyCoverage(dataset, buckets, [vocab], 'guru')

    expect(result.coveragePercent).toBe(0)
    expect(result.inWanikaniCount).toBe(0)
  })

  it('buckets are cumulative and clamp to the dataset length', () => {
    const subjects = [makeEnriched('日', 5), makeEnriched('語', 5)]
    const result = computeFrequencyCoverage(dataset, buckets, subjects, 'guru')

    const top2 = result.buckets[0]
    expect(top2.total).toBe(2)
    expect(top2.known).toBe(1) // 日 yes, 本 no
    // Within Top 2: 50 known of 80 weight
    expect(top2.coveragePercent).toBe(62.5)

    const top10 = result.buckets[1]
    expect(top10.total).toBe(4) // clamped to list length
    expect(top10.known).toBe(2)
    expect(top10.coveragePercent).toBe(65) // (50+15)/100
  })

  it('handles zero subjects without NaN', () => {
    const result = computeFrequencyCoverage(dataset, buckets, [], 'guru')

    expect(result.coveragePercent).toBe(0)
    expect(result.maxPossiblePercent).toBe(0)
    expect(result.buckets.every((b) => b.coveragePercent === 0)).toBe(true)
  })

  it('rounds to one decimal place', () => {
    const oneThird: FrequencyDataset = {
      total: 3,
      kanji: [
        ['日', 1],
        ['本', 1],
        ['語', 1],
      ],
    }
    const result = computeFrequencyCoverage(oneThird, [], [makeEnriched('日', 5)], 'guru')

    expect(result.coveragePercent).toBe(33.3)
  })
})
