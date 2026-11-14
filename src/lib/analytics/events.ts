// Usage-analytics event contract, shared by the browser client
// (src/lib/analytics/track.ts) and the Cloudflare Worker (worker/src/index.ts).
//
// Pure module: no DOM, no React, no app imports — the Worker bundles it
// directly. See docs/analytics-plan.md for what each event is for.
//
// Privacy invariants enforced here (the Worker rejects anything else):
// - the only identifier is `uidc`, a SHA-256 hex digest of the WaniKani user
//   UUID; the API token and username are never part of any event
// - every other field is a closed enum, a small integer or the app version

/**
 * Feature pages, in bit order: a page's index is its bit in the Worker's
 * per-user-day `pages` bitmask. Append only — never reorder or remove, or
 * stored bitmasks change meaning.
 */
export const PAGES = [
  'dashboard',
  'progress',
  'activity',
  'accuracy',
  'forecast',
  'leeches',
  'trainer',
  'kanji',
  'readiness',
  'settings',
] as const
export type PageName = (typeof PAGES)[number]

export const CONNECT_FAIL_REASONS = [
  'invalid_token',
  'network',
  'rate_limited',
  'server',
  'other',
] as const
export type ConnectFailReason = (typeof CONNECT_FAIL_REASONS)[number]

export const ERROR_KINDS = ['sync', 'crash', 'chunk', 'auth'] as const
export type ErrorKind = (typeof ERROR_KINDS)[number]

export type AnalyticsEvent =
  | { e: 'landing'; v: string }
  | { e: 'connect'; v: string; uidc: string }
  | { e: 'connect_fail'; v: string; reason: ConnectFailReason }
  | { e: 'open'; v: string; uidc: string; cached: boolean; pwa: boolean }
  | { e: 'view'; v: string; uidc: string; page: PageName }
  | { e: 'error'; v: string; uidc?: string; kind: ErrorKind; status?: number }

/** Distributive Omit, so callers can build an event without the version. */
export type EventInput = AnalyticsEvent extends infer E
  ? E extends AnalyticsEvent
    ? Omit<E, 'v'>
    : never
  : never

/** Maximum accepted request body, in bytes. Real events are ~150 bytes. */
export const MAX_EVENT_BYTES = 1024

/** Bit for a page in the per-user-day `pages` bitmask. */
export function pageBit(page: PageName): number {
  return 1 << PAGES.indexOf(page)
}

const PATH_TO_PAGE: Record<string, PageName> = {
  '/': 'dashboard',
  '/progress': 'progress',
  '/activity': 'activity',
  '/accuracy': 'accuracy',
  '/forecast': 'forecast',
  '/leeches': 'leeches',
  '/trainer': 'trainer',
  '/kanji': 'kanji',
  '/readiness': 'readiness',
  '/jlpt': 'readiness',
  '/settings': 'settings',
}

/**
 * Map a router pathname (already stripped of the basename) to a page name.
 * Returns null for unknown paths, which the router redirects anyway.
 */
export function pageFromPath(pathname: string): PageName | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return PATH_TO_PAGE[normalized] ?? null
}

// ---------------------------------------------------------------------------
// Validation (used by the Worker on untrusted input)
// ---------------------------------------------------------------------------

const UIDC_RE = /^[0-9a-f]{64}$/
const VERSION_RE = /^[0-9A-Za-z.+-]{1,20}$/

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

/**
 * Validate an untrusted payload and rebuild it with only known fields.
 * Returns null when anything is missing, unknown or malformed, so extra
 * properties a client might send are never stored.
 */
export function validateEvent(raw: unknown): AnalyticsEvent | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>

  if (typeof r.v !== 'string' || !VERSION_RE.test(r.v)) return null
  const v = r.v
  const uidcOk = typeof r.uidc === 'string' && UIDC_RE.test(r.uidc)

  switch (r.e) {
    case 'landing':
      return { e: 'landing', v }
    case 'connect':
      return uidcOk ? { e: 'connect', v, uidc: r.uidc as string } : null
    case 'connect_fail':
      return isOneOf(CONNECT_FAIL_REASONS, r.reason)
        ? { e: 'connect_fail', v, reason: r.reason }
        : null
    case 'open':
      if (!uidcOk || typeof r.cached !== 'boolean' || typeof r.pwa !== 'boolean') return null
      return { e: 'open', v, uidc: r.uidc as string, cached: r.cached, pwa: r.pwa }
    case 'view':
      return uidcOk && isOneOf(PAGES, r.page)
        ? { e: 'view', v, uidc: r.uidc as string, page: r.page }
        : null
    case 'error': {
      if (!isOneOf(ERROR_KINDS, r.kind)) return null
      if (r.uidc !== undefined && !uidcOk) return null
      if (
        r.status !== undefined &&
        !(Number.isInteger(r.status) && (r.status as number) >= 0 && (r.status as number) <= 599)
      ) {
        return null
      }
      const event: Extract<AnalyticsEvent, { e: 'error' }> = { e: 'error', v, kind: r.kind }
      if (uidcOk) event.uidc = r.uidc as string
      if (r.status !== undefined) event.status = r.status as number
      return event
    }
    default:
      return null
  }
}

/**
 * Classify a failed WaniKani API call into a connect-failure reason.
 * `status` is WaniKaniAPIError.status (0 = network failure).
 */
export function connectFailReason(status: number | undefined): ConnectFailReason {
  if (status === undefined) return 'other'
  if (status === 0) return 'network'
  if (status === 401) return 'invalid_token'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'other'
}
