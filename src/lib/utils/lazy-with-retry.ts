/**
 * Lazy import wrapper with automatic retry for chunk load errors
 *
 * When a new version is deployed, old chunks are no longer available.
 * This wrapper detects chunk load errors and automatically reloads the page
 * to fetch the new version, providing a seamless update experience.
 */

import { ComponentType, lazy } from 'react'

const RELOAD_KEY = 'chunk-reload-attempted'
const MAX_RETRIES = 1

/**
 * Checks if an error is a chunk load error
 */
function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed') ||
    error.message.includes('error loading dynamically imported module')
  )
}

/**
 * Reloads the page to fetch new chunks after a deployment
 */
function reloadForNewVersion(): void {
  const reloadAttempts = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10)

  if (reloadAttempts < MAX_RETRIES) {
    console.log('[Chunk Loader] Chunk load error detected - reloading for new version')
    sessionStorage.setItem(RELOAD_KEY, String(reloadAttempts + 1))
    window.location.reload()
  } else {
    // Max retries reached - clear the flag and let error bubble up
    console.error('[Chunk Loader] Max reload attempts reached - letting error surface')
    sessionStorage.removeItem(RELOAD_KEY)
  }
}

/**
 * Wraps React.lazy with automatic chunk error handling and reload
 *
 * @param importFunc - The dynamic import function
 * @returns A lazy-loaded component with retry logic
 *
 * @example
 * const Dashboard = lazyWithRetry(() => import('./pages/dashboard'))
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    // Clear reload flag on successful load
    sessionStorage.removeItem(RELOAD_KEY)

    try {
      return await importFunc()
    } catch (error) {
      // Check if it's a chunk load error
      if (error instanceof Error && isChunkLoadError(error)) {
        reloadForNewVersion()
        // Return a never-resolving promise to prevent error UI flash
        return new Promise(() => {})
      }

      // Re-throw other errors to be caught by error boundary
      throw error
    }
  })
}
