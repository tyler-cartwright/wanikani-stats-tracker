// Kanji frequency coverage
//
// Joins a static corpus frequency dataset against the user's kanji SRS
// stages to answer "what share of the kanji you'd meet in real text can
// you actually read?" Coverage is occurrence-weighted: knowing 日 (rank 1)
// moves the number far more than knowing an obscure rank-2,800 kanji —
// unlike the count-based estimate this replaces.
import type { EnrichedSubject } from './kanji-grid'
import type { SRSThreshold } from '@/data/jlpt'
import { getMinSrsStage } from './jlpt-readiness'
import { FREQUENCY_BUCKETS, NEWS_FREQUENCY } from '@/data/frequency'
import type { FrequencyBucketDef, FrequencyDataset } from '@/data/frequency'

export interface FrequencyBucketData {
  label: string
  size: number // requested rank cutoff (cumulative: ranks 1..size)
  total: number // actual characters in the bucket (cutoff clamped to the list)
  known: number
  inWanikani: number
  // Occurrence-weighted coverage within the bucket, one decimal
  coveragePercent: number
}

export interface FrequencyCoverageResult {
  // Share of all kanji occurrences in the corpus that are kanji known at
  // the threshold, one decimal (e.g. 87.4)
  coveragePercent: number
  // Ceiling if every WaniKani-taught kanji on the list were known —
  // honesty cap: some corpus kanji aren't in WaniKani at all
  maxPossiblePercent: number
  knownCount: number
  listedCount: number
  inWanikaniCount: number
  buckets: FrequencyBucketData[]
  threshold: SRSThreshold
}

function toPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

export function computeFrequencyCoverage(
  dataset: FrequencyDataset,
  buckets: FrequencyBucketDef[],
  subjects: EnrichedSubject[],
  threshold: SRSThreshold
): FrequencyCoverageResult {
  const minStage = getMinSrsStage(threshold)

  // Match by character, same model as the Jōyō readiness join
  const subjectMap = new Map<string, EnrichedSubject>()
  for (const subject of subjects) {
    if (subject.subjectType === 'kanji' && subject.character) {
      subjectMap.set(subject.character, subject)
    }
  }

  let knownWeight = 0
  let wkWeight = 0
  let knownCount = 0
  let inWanikaniCount = 0
  const bucketAcc = buckets.map((def) => ({
    def,
    total: 0,
    known: 0,
    inWanikani: 0,
    knownWeight: 0,
    weight: 0,
  }))

  dataset.kanji.forEach(([char, count], index) => {
    const rank = index + 1
    const subject = subjectMap.get(char)
    const isKnown = subject !== undefined && subject.srsStage >= minStage

    if (subject) {
      inWanikaniCount++
      wkWeight += count
    }
    if (isKnown) {
      knownCount++
      knownWeight += count
    }

    for (const acc of bucketAcc) {
      if (rank > acc.def.size) continue
      acc.total++
      acc.weight += count
      if (subject) acc.inWanikani++
      if (isKnown) {
        acc.known++
        acc.knownWeight += count
      }
    }
  })

  return {
    coveragePercent: toPercent(knownWeight, dataset.total),
    maxPossiblePercent: toPercent(wkWeight, dataset.total),
    knownCount,
    listedCount: dataset.kanji.length,
    inWanikaniCount,
    buckets: bucketAcc.map((acc) => ({
      label: acc.def.label,
      size: acc.def.size,
      total: acc.total,
      known: acc.known,
      inWanikani: acc.inWanikani,
      coveragePercent: toPercent(acc.knownWeight, acc.weight),
    })),
    threshold,
  }
}

/** Coverage against the vendored Japanese Wikinews dataset. */
export function calculateNewsFrequencyCoverage(
  subjects: EnrichedSubject[],
  threshold: SRSThreshold
): FrequencyCoverageResult {
  return computeFrequencyCoverage(NEWS_FREQUENCY, FREQUENCY_BUCKETS, subjects, threshold)
}
