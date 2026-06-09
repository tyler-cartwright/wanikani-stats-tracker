/**
 * App Version Manager
 *
 * Records which app version last ran, so upgrades can be observed (logging,
 * potential future "what's new" UI). Version changes are intentionally
 * non-destructive: IndexedDB schema changes are handled by migrations
 * (src/lib/db/migrations.ts) and asset freshness by the service worker's
 * autoUpdate flow — synced data must survive every release.
 */

import { getById, putOne, STORES } from '@/lib/db/database'

// Import version from package.json via Vite
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.1.3'

interface VersionMetadata {
  id: 'app_version'
  version: string
  lastChecked: string
}

/**
 * Records the current app version and reports whether it changed since the
 * last run. Should be called on app initialization. Never clears any data.
 */
export async function checkAndUpdateVersion(): Promise<{
  versionChanged: boolean
  previousVersion: string | null
  currentVersion: string
}> {
  const storedMetadata = await getById<VersionMetadata>(
    STORES.SYNC_METADATA,
    'app_version'
  )

  const previousVersion = storedMetadata?.version || null
  const versionChanged = previousVersion !== null && previousVersion !== APP_VERSION

  if (versionChanged) {
    console.log(`[VERSION] App updated from ${previousVersion} to ${APP_VERSION}`)
  }

  const newMetadata: VersionMetadata = {
    id: 'app_version',
    version: APP_VERSION,
    lastChecked: new Date().toISOString(),
  }
  await putOne(STORES.SYNC_METADATA, newMetadata)

  return {
    versionChanged,
    previousVersion,
    currentVersion: APP_VERSION,
  }
}

/**
 * Gets the current app version
 */
export function getAppVersion(): string {
  return APP_VERSION
}
