/**
 * Simple seeded random number generator using Mulberry32 algorithm
 * Returns consistent pseudo-random numbers for the same seed
 */
export class SeededRandom {
  private state: number

  constructor(seed: number) {
    // Ensure seed is a positive 32-bit integer
    this.state = Math.abs(seed | 0)
  }

  /**
   * Generate next random number between 0 (inclusive) and 1 (exclusive)
   * Uses Mulberry32 algorithm for good distribution
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Create a deterministic seed from multiple inputs
 * Used to ensure forecast stability while still updating with real changes
 */
export function createForecastSeed(userId: string, date: Date, lessonsPerDay: number): number {
  // Use: user ID + YYYY-MM-DD + lessons per day
  const dateStr = date.toISOString().split('T')[0]
  const seedStr = `${userId}-${dateStr}-${lessonsPerDay}`

  // Simple string hash function
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash)
}
