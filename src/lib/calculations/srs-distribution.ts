// SRS Distribution Calculations
import type { Assignment, SRSDistribution } from '@/lib/api/types'

/**
 * Calculate SRS distribution from assignments
 * Maps numeric SRS stages to named categories
 *
 * Stage mapping:
 * - 0: initiate (not counted in distribution)
 * - 1-4: apprentice
 * - 5-6: guru
 * - 7: master
 * - 8: enlightened
 * - 9: burned
 */
export function calculateSRSDistribution(
  assignments: Assignment[]
): SRSDistribution {
  const distribution: SRSDistribution = {
    apprentice: 0,
    guru: 0,
    master: 0,
    enlightened: 0,
    burned: 0,
  }

  for (const assignment of assignments) {
    // Skip hidden or unstarted assignments
    if (assignment.hidden || !assignment.started_at) {
      continue
    }

    const stage = assignment.srs_stage

    if (stage >= 1 && stage <= 4) {
      distribution.apprentice++
    } else if (stage >= 5 && stage <= 6) {
      distribution.guru++
    } else if (stage === 7) {
      distribution.master++
    } else if (stage === 8) {
      distribution.enlightened++
    } else if (stage === 9) {
      distribution.burned++
    }
  }

  return distribution
}

/**
 * Get total count across all SRS stages
 */
export function getTotalSRSCount(distribution: SRSDistribution): number {
  return (
    distribution.apprentice +
    distribution.guru +
    distribution.master +
    distribution.enlightened +
    distribution.burned
  )
}

/**
 * Calculate percentage for each SRS stage
 */
export function calculateSRSPercentages(
  distribution: SRSDistribution
): Record<keyof SRSDistribution, number> {
  const total = getTotalSRSCount(distribution)

  if (total === 0) {
    return {
      apprentice: 0,
      guru: 0,
      master: 0,
      enlightened: 0,
      burned: 0,
    }
  }

  return {
    apprentice: Math.round((distribution.apprentice / total) * 100),
    guru: Math.round((distribution.guru / total) * 100),
    master: Math.round((distribution.master / total) * 100),
    enlightened: Math.round((distribution.enlightened / total) * 100),
    burned: Math.round((distribution.burned / total) * 100),
  }
}
