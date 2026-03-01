import type { LevelProgression } from '@/lib/api/types'

export interface DetectedReset {
  resetDate: string     // abandoned_at timestamp
  originalLevel: number // highest level before reset
  targetLevel: number   // level reset to
}

export function detectResets(progressions: LevelProgression[]): DetectedReset[] {
  const abandoned = progressions.filter((p) => p.abandoned_at !== null)
  if (abandoned.length === 0) return []

  // Group by abandoned_at rounded to nearest minute to handle minor differences
  const groups = new Map<string, LevelProgression[]>()
  for (const p of abandoned) {
    const rounded = new Date(Math.round(new Date(p.abandoned_at!).getTime() / 60000) * 60000).toISOString()
    if (!groups.has(rounded)) groups.set(rounded, [])
    groups.get(rounded)!.push(p)
  }

  const resets: DetectedReset[] = []
  for (const [resetDate, group] of groups) {
    const levels = group.map((p) => p.level)
    const originalLevel = Math.max(...levels)
    const targetLevel = Math.max(1, Math.min(...levels) - 1)
    resets.push({ resetDate, originalLevel, targetLevel })
  }

  return resets.sort((a, b) => a.resetDate.localeCompare(b.resetDate))
}
