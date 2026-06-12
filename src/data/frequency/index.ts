// Kanji usage frequency in Japanese news text
//
// Source: scriptin/kanji-frequency (GitHub), news_characters.csv —
// occurrence counts for 2,940 kanji across the Japanese Wikinews corpus.
// Licensed CC BY 4.0; attribution is surfaced in the Readiness UI.
import newsFrequencyData from './news-frequency.json'
import type { FrequencyBucketDef, FrequencyDataset } from './types'

export type { FrequencyBucketDef, FrequencyDataset, FrequencyEntry } from './types'

export const NEWS_FREQUENCY = newsFrequencyData as FrequencyDataset

// Cumulative rank buckets shown on the Readiness page
export const FREQUENCY_BUCKETS: FrequencyBucketDef[] = [
  { label: 'Top 100', size: 100 },
  { label: 'Top 500', size: 500 },
  { label: 'Top 1,000', size: 1000 },
  { label: 'Top 2,500', size: 2500 },
]

export const FREQ_DATA_VERSION = '1.0.0'
export const FREQ_DATA_LAST_UPDATED = '2026-06-12'
export const FREQ_DATA_SOURCE = 'scriptin/kanji-frequency (GitHub)'
export const FREQ_DATA_LICENSE = 'CC BY 4.0'
export const FREQ_CORPUS = 'Japanese Wikinews'
