import { describe, expect, it } from 'vitest'
import { filterPostResetProgressions } from './progression-filter'
import { makeLevelProgression, makeReset } from '@/lib/test/fixtures'

describe('filterPostResetProgressions', () => {
  it('returns progressions unchanged when there are no resets', () => {
    const progressions = [
      makeLevelProgression({ level: 1, created_at: '2025-01-01T00:00:00.000000Z' }),
      makeLevelProgression({ level: 2, created_at: '2025-01-10T00:00:00.000000Z' }),
    ]

    expect(filterPostResetProgressions(progressions, [])).toEqual(progressions)
  })

  it('ignores unconfirmed resets', () => {
    const progressions = [
      makeLevelProgression({ level: 1, created_at: '2025-01-01T00:00:00.000000Z' }),
    ]
    const resets = [makeReset({ target_level: 1, confirmed_at: null })]

    expect(filterPostResetProgressions(progressions, resets)).toEqual(progressions)
  })

  it('excludes pre-reset progressions at or above the target level', () => {
    const reset = makeReset({
      original_level: 5,
      target_level: 3,
      confirmed_at: '2025-06-01T00:00:00.000000Z',
    })
    const preResetLevel5 = makeLevelProgression({
      level: 5,
      created_at: '2025-05-01T00:00:00.000000Z',
      abandoned_at: '2025-06-01T00:00:00.000000Z',
    })
    const postResetLevel3 = makeLevelProgression({
      level: 3,
      created_at: '2025-06-02T00:00:00.000000Z',
    })

    const result = filterPostResetProgressions(
      [preResetLevel5, postResetLevel3],
      [reset]
    )

    expect(result).toEqual([postResetLevel3])
  })

  it('excludes previously-completed pre-reset levels even when abandoned_at is null', () => {
    // WaniKani only sets abandoned_at on the level in progress at reset time;
    // completed levels at or above target_level keep abandoned_at === null
    // and must still be excluded (bug history: #33/#37/#38).
    const reset = makeReset({
      original_level: 5,
      target_level: 3,
      confirmed_at: '2025-06-01T00:00:00.000000Z',
    })
    const completedPreResetLevel4 = makeLevelProgression({
      level: 4,
      created_at: '2025-04-01T00:00:00.000000Z',
      passed_at: '2025-04-20T00:00:00.000000Z',
      completed_at: '2025-04-20T00:00:00.000000Z',
      abandoned_at: null,
    })

    expect(filterPostResetProgressions([completedPreResetLevel4], [reset])).toEqual([])
  })

  it('keeps pre-reset progressions below the target level', () => {
    const reset = makeReset({
      original_level: 5,
      target_level: 3,
      confirmed_at: '2025-06-01T00:00:00.000000Z',
    })
    const level1 = makeLevelProgression({
      level: 1,
      created_at: '2025-01-01T00:00:00.000000Z',
    })
    const level2 = makeLevelProgression({
      level: 2,
      created_at: '2025-02-01T00:00:00.000000Z',
    })

    expect(filterPostResetProgressions([level1, level2], [reset])).toEqual([
      level1,
      level2,
    ])
  })

  it('keeps post-reset progressions at or above the target level', () => {
    const reset = makeReset({
      original_level: 5,
      target_level: 3,
      confirmed_at: '2025-06-01T00:00:00.000000Z',
    })
    const newLevel3 = makeLevelProgression({
      level: 3,
      created_at: '2025-06-02T00:00:00.000000Z',
    })
    const newLevel4 = makeLevelProgression({
      level: 4,
      created_at: '2025-07-01T00:00:00.000000Z',
    })

    expect(filterPostResetProgressions([newLevel3, newLevel4], [reset])).toEqual([
      newLevel3,
      newLevel4,
    ])
  })

  it('deduplicates by level, keeping the most recent progression', () => {
    const older = makeLevelProgression({
      level: 2,
      created_at: '2025-01-01T00:00:00.000000Z',
    })
    const newer = makeLevelProgression({
      level: 2,
      created_at: '2025-03-01T00:00:00.000000Z',
    })

    expect(filterPostResetProgressions([older, newer], [])).toEqual([older, newer])

    // Dedup only applies once at least one confirmed reset exists
    const reset = makeReset({
      target_level: 5,
      confirmed_at: '2024-01-01T00:00:00.000000Z',
    })
    expect(filterPostResetProgressions([older, newer], [reset])).toEqual([newer])
  })

  it('applies multiple resets cumulatively', () => {
    // First reset 10 -> 5, later reset 7 -> 2
    const firstReset = makeReset({
      original_level: 10,
      target_level: 5,
      confirmed_at: '2025-03-01T00:00:00.000000Z',
    })
    const secondReset = makeReset({
      original_level: 7,
      target_level: 2,
      confirmed_at: '2025-08-01T00:00:00.000000Z',
    })

    const beforeFirstLevel6 = makeLevelProgression({
      level: 6,
      created_at: '2025-01-01T00:00:00.000000Z',
    })
    const betweenResetsLevel5 = makeLevelProgression({
      level: 5,
      created_at: '2025-03-02T00:00:00.000000Z',
    })
    const afterSecondLevel2 = makeLevelProgression({
      level: 2,
      created_at: '2025-08-02T00:00:00.000000Z',
    })
    const beforeBothLevel1 = makeLevelProgression({
      level: 1,
      created_at: '2024-12-01T00:00:00.000000Z',
    })

    const result = filterPostResetProgressions(
      [beforeFirstLevel6, betweenResetsLevel5, afterSecondLevel2, beforeBothLevel1],
      [firstReset, secondReset]
    )

    // Level 6 falls to the first reset; level 5 (created between resets) falls
    // to the second; levels 1 and 2 survive.
    expect(result).toEqual([afterSecondLevel2, beforeBothLevel1])
  })
})
