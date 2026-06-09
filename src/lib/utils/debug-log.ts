// Debug logging that only emits in dev builds.
// Use for diagnostic noise; real failures should use console.error/warn.
export function debugLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}
