import type { LevelProgression, Reset } from '@/lib/api/types'

/**
 * Filter level progressions to only include post-reset data.
 *
 * The WaniKani API only sets `abandoned_at` on the level actively in progress
 * at reset time. Previously completed levels keep `abandoned_at === null` and
 * thus incorrectly pass simple filters. This function uses the authoritative
 * `/resets` API data to properly exclude pre-reset progressions.
 *
 * Logic per confirmed reset:
 *   Exclude any progression where level >= target_level AND created_at < confirmed_at
 *
 * After filtering, deduplicates by level number, keeping the most recent progression.
 */
export function filterPostResetProgressions(
  progressions: LevelProgression[],
  resets: Reset[]
): LevelProgression[] {
  const confirmedResets = resets.filter((r) => r.confirmed_at !== null)

  if (confirmedResets.length === 0) return progressions

  const filtered = progressions.filter((p) => {
    for (const reset of confirmedResets) {
      if (p.level >= reset.target_level && p.created_at < reset.confirmed_at!) {
        return false
      }
    }
    return true
  })

  // Deduplicate by level: keep most recent created_at
  const byLevel = new Map<number, LevelProgression>()
  for (const p of filtered) {
    const existing = byLevel.get(p.level)
    if (!existing || new Date(p.created_at) > new Date(existing.created_at)) {
      byLevel.set(p.level, p)
    }
  }

  return Array.from(byLevel.values())
}
