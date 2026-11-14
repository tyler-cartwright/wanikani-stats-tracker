// Usage analytics — browser client
//
// Sends tiny fire-and-forget beacons to the first-party Worker at
// VITE_ANALYTICS_ENDPOINT (wanitrack.com/api/event). Disabled entirely when
// that variable is unset (dev, tests, forks), when the user has opted out in
// Settings, or when the browser sends Global Privacy Control.
//
// Never sent: the API token, the username, or anything else from WaniKani
// except a SHA-256 digest of the user's UUID. The only thing this module
// writes to the device is the user's opt-out choice (OPT_OUT_KEY), which is
// needed to honour it. See docs/analytics-plan.md.

import type { AnalyticsEvent, ErrorKind, EventInput } from './events'

const ENDPOINT: string | undefined = import.meta.env.VITE_ANALYTICS_ENDPOINT
const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || 'dev'

/** Public, fixed prefix. The Worker applies a secret HMAC on top. */
const HASH_PREFIX = 'wanitrack:v1:'

/** Digest of the current user's UUID, once known (in memory only). */
let currentUidc: string | null = null
let landingSent = false
let openSent = false

// ---------------------------------------------------------------------------
// Opt-out (own localStorage key, so this module has no store dependencies)
// ---------------------------------------------------------------------------

export const OPT_OUT_KEY = 'wanitrack-analytics-optout'
const optOutListeners = new Set<() => void>()

export function getAnalyticsOptOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setAnalyticsOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, '1')
    else localStorage.removeItem(OPT_OUT_KEY)
  } catch {
    // Storage unavailable: nothing persisted, and nothing to honour later
  }
  optOutListeners.forEach((listener) => listener())
}

/** For useSyncExternalStore. */
export function subscribeAnalyticsOptOut(listener: () => void): () => void {
  optOutListeners.add(listener)
  return () => optOutListeners.delete(listener)
}

/** True when the browser sends the Global Privacy Control signal. */
export function hasGlobalPrivacyControl(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  )
}

export function analyticsEnabled(): boolean {
  if (!ENDPOINT) return false
  if (getAnalyticsOptOut()) return false
  if (hasGlobalPrivacyControl()) return false
  return true
}

/** SHA-256 hex of the prefixed WaniKani user UUID. */
export async function hashUserId(userId: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(HASH_PREFIX + userId))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Remember the current user's digest so later events (errors from deep in
 * the sync layer, page views) can carry it. Returns the digest.
 */
export async function identify(userId: string): Promise<string> {
  currentUidc = await hashUserId(userId)
  return currentUidc
}

/** Forget the user (on logout). */
export function resetIdentity(): void {
  currentUidc = null
  openSent = false
}

export function currentUserDigest(): string | null {
  return currentUidc
}

function send(event: AnalyticsEvent): void {
  if (!ENDPOINT) return
  try {
    const body = JSON.stringify(event)
    const blob = new Blob([body], { type: 'application/json' })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon?.(ENDPOINT, blob)) return
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {})
  } catch {
    // Analytics must never affect the app
  }
}

/** Send one event if analytics is enabled. Never throws. */
export function track(input: EventInput): void {
  try {
    if (!analyticsEnabled()) return
    send({ ...input, v: APP_VERSION } as AnalyticsEvent)
  } catch {
    // ignore
  }
}

/** Landing (Setup) page shown — at most once per page load. No identifier. */
export function trackLanding(): void {
  if (landingSent) return
  landingSent = true
  track({ e: 'landing' })
}

/** Authenticated app loaded — at most once per page load per user. */
export function trackOpen(cached: boolean): void {
  if (openSent || !currentUidc) return
  openSent = true
  track({ e: 'open', uidc: currentUidc, cached, pwa: isStandalone() })
}

/** Report an error class (never a message). Includes the user digest if known. */
export function trackError(kind: ErrorKind, status?: number): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return // offline is expected, not an error
  track({
    e: 'error',
    kind,
    ...(currentUidc ? { uidc: currentUidc } : {}),
    ...(status !== undefined ? { status } : {}),
  })
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}
