// Milestone Calculations
import type { Assignment, LevelProgression } from '@/lib/api/types'

export interface Milestone {
  id: string
  type: 'burn' | 'level' | 'srs'
  label: string
  description: string
  icon: string // Lucide icon name
  achievedAt: Date | null
  target: number
  current: number
  isAchieved: boolean
}

export interface MilestoneTimeline {
  achieved: Milestone[]
  upcoming: Milestone[]
  stats: {
    totalAchieved: number
    nextMilestone: Milestone | null
  }
}

/**
 * Calculate all milestones based on assignments and level progressions
 */
export function calculateMilestones(
  assignments: Assignment[],
  levelProgressions: LevelProgression[],
  subjects: Array<{ id: number; hidden_at: string | null }>,
  currentLevel: number
): MilestoneTimeline {
  const milestones: Milestone[] = []

  // Get burn milestones
  milestones.push(...getBurnMilestones(assignments, subjects))

  // Get Guru milestones (based on passed_at)
  milestones.push(...getGuruMilestones(assignments, subjects))

  // Get level milestones
  milestones.push(...getLevelMilestones(levelProgressions, currentLevel))

  // Separate achieved and upcoming
  const achieved = milestones
    .filter((m) => m.isAchieved)
    .sort((a, b) => {
      if (!a.achievedAt || !b.achievedAt) return 0
      return b.achievedAt.getTime() - a.achievedAt.getTime()
    })

  const upcoming = milestones
    .filter((m) => !m.isAchieved)
    .sort((a, b) => {
      // Sort by how close they are to completion (percentage)
      const aProgress = a.target > 0 ? a.current / a.target : 0
      const bProgress = b.target > 0 ? b.current / b.target : 0
      return bProgress - aProgress
    })

  return {
    achieved,
    upcoming,
    stats: {
      totalAchieved: achieved.length,
      nextMilestone: upcoming[0] || null,
    },
  }
}

/**
 * Get burn-related milestones
 */
function getBurnMilestones(
  assignments: Assignment[],
  subjects: Array<{ id: number; hidden_at: string | null }>
): Milestone[] {
  const burned = assignments
    .filter((a) => a.burned_at && !a.hidden)
    .map((a) => ({
      id: a.subject_id,
      burnedAt: new Date(a.burned_at!),
    }))
    .sort((a, b) => a.burnedAt.getTime() - b.burnedAt.getTime())

  const currentBurned = burned.length
  const totalAvailable = subjects.filter((s) => !s.hidden_at).length

  const targets = [1, 100, 500, 1000, 2500, 5000, totalAvailable]

  return targets.map((target) => {
    const isAchieved = currentBurned >= target
    const achievedItem = burned[target - 1] // Get the Nth burned item (0-indexed)

    return {
      id: `burn-${target}`,
      type: 'burn' as const,
      label: target === 1 ? 'First Burn' : target === totalAvailable ? 'All Burned' : `${target.toLocaleString()} Burns`,
      description:
        target === 1
          ? 'Burned your first item'
          : target === totalAvailable
          ? 'Burned all available items'
          : `Burned ${target.toLocaleString()} items`,
      icon: 'Flame',
      achievedAt: isAchieved && achievedItem ? achievedItem.burnedAt : null,
      target,
      current: currentBurned,
      isAchieved,
    }
  })
}

/**
 * Get Guru-related milestones
 * Based on passed_at (items that ever reached Guru)
 */
function getGuruMilestones(
  assignments: Assignment[],
  subjects: Array<{ id: number; hidden_at: string | null }>
): Milestone[] {
  // Get all items that have passed Guru (have passed_at timestamp)
  const passed = assignments
    .filter((a) => a.passed_at && !a.hidden)
    .map((a) => ({
      id: a.subject_id,
      passedAt: new Date(a.passed_at!),
    }))
    .sort((a, b) => a.passedAt.getTime() - b.passedAt.getTime())

  const currentPassed = passed.length
  const totalAvailable = subjects.filter((s) => !s.hidden_at).length

  const targets = [1, 100, 500, 1000, 2500, 5000, totalAvailable]

  return targets.map((target) => {
    const isAchieved = currentPassed >= target
    const achievedItem = passed[target - 1] // Get the Nth passed item (0-indexed)

    return {
      id: `guru-${target}`,
      type: 'srs' as const,
      label: target === 1 ? 'First Guru' : target === totalAvailable ? 'All Guru' : `${target.toLocaleString()} Guru`,
      description:
        target === 1
          ? 'Reached Guru on your first item'
          : target === totalAvailable
          ? 'Reached Guru on all available items'
          : `Reached Guru on ${target.toLocaleString()} items`,
      icon: 'Star',
      achievedAt: isAchieved && achievedItem ? achievedItem.passedAt : null,
      target,
      current: currentPassed,
      isAchieved,
    }
  })
}

/**
 * Get level-related milestones
 */
function getLevelMilestones(
  levelProgressions: LevelProgression[],
  currentLevel: number
): Milestone[] {
  const targets = [10, 20, 30, 40, 50, 60]

  return targets.map((target) => {
    // For reset levels, prefer the progression with passed_at (completed) over abandoned ones
    const progression = levelProgressions
      .filter((p) => p.level === target)
      .sort((a, b) => {
        // Prioritize passed levels
        if (a.passed_at && !b.passed_at) return -1
        if (!a.passed_at && b.passed_at) return 1
        // Otherwise use most recent created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })[0]
    const isAchieved = currentLevel >= target
    const achievedAt = progression?.passed_at ? new Date(progression.passed_at) : null

    return {
      id: `level-${target}`,
      type: 'level' as const,
      label: `Level ${target}`,
      description:
        target === 60
          ? 'Reached maximum level'
          : `Completed level ${target}`,
      icon: 'Trophy',
      achievedAt,
      target,
      current: currentLevel,
      isAchieved,
    }
  })
}
