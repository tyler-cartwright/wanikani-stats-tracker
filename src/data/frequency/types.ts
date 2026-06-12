// Kanji frequency dataset types

// [character, occurrence count] — entries are stored in rank order, so
// rank = index + 1 and is never stored explicitly
export type FrequencyEntry = [character: string, count: number]

export interface FrequencyDataset {
  // Total kanji occurrences in the corpus (sum of every entry's count)
  total: number
  kanji: FrequencyEntry[]
}

export interface FrequencyBucketDef {
  label: string
  // Rank cutoff: the bucket covers ranks 1..size (cumulative)
  size: number
}
