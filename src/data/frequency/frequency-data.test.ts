// Integrity pins for the vendored frequency dataset — cheap insurance
// against a bad re-vendor silently skewing every coverage number.
import { describe, expect, it } from 'vitest'
import { FREQUENCY_BUCKETS, NEWS_FREQUENCY } from './index'

describe('news frequency dataset', () => {
  it('has the expected shape and size', () => {
    expect(NEWS_FREQUENCY.kanji.length).toBe(2940)
    expect(NEWS_FREQUENCY.total).toBeGreaterThan(1_000_000)
  })

  it('contains no duplicate characters', () => {
    const chars = new Set(NEWS_FREQUENCY.kanji.map(([char]) => char))
    expect(chars.size).toBe(NEWS_FREQUENCY.kanji.length)
  })

  it('counts are positive and in non-increasing rank order', () => {
    let previous = Infinity
    for (const [char, count] of NEWS_FREQUENCY.kanji) {
      expect(count, `count for ${char}`).toBeGreaterThan(0)
      expect(count, `rank order at ${char}`).toBeLessThanOrEqual(previous)
      previous = count
    }
  })

  it('counts sum to the recorded total', () => {
    const sum = NEWS_FREQUENCY.kanji.reduce((acc, [, count]) => acc + count, 0)
    expect(sum).toBe(NEWS_FREQUENCY.total)
  })

  it('bucket cutoffs are ascending and within reach of the dataset', () => {
    let previous = 0
    for (const bucket of FREQUENCY_BUCKETS) {
      expect(bucket.size).toBeGreaterThan(previous)
      previous = bucket.size
    }
    // The largest bucket may exceed the list length (it clamps), but not absurdly
    expect(FREQUENCY_BUCKETS[FREQUENCY_BUCKETS.length - 1].size).toBeLessThanOrEqual(
      NEWS_FREQUENCY.kanji.length
    )
  })
})
