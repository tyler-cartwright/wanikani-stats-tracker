// WaniTrack usage-analytics Worker
//
// Route: wanitrack.com/api/event (same origin as the GitHub Pages site, which
// Cloudflare proxies). Accepts small JSON beacons, validates them against the
// shared contract, pseudonymises the user id with a server-side secret, and
// upserts aggregate rows into D1. Never stores or logs IPs or user agents.
// See docs/analytics-plan.md and worker/README.md.

import { MAX_EVENT_BYTES, validateEvent } from '../../src/lib/analytics/events'
import { writesFor } from './writes'

// Minimal D1 surface, so the Worker typechecks without extra dependencies
interface D1PreparedStatement {
  bind(...values: (string | number)[]): D1PreparedStatement
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<unknown>
}

export interface Env {
  DB: D1Database
  /** Secret (wrangler secret put UID_SECRET). Destroy it to anonymise stored ids. */
  UID_SECRET: string
  /** Allowed Origin header, default https://wanitrack.com */
  ALLOWED_ORIGIN?: string
  /** Comma-separated server uids to drop (e.g. the maintainer's own) */
  EXCLUDE_UIDS?: string
}

const RETENTION_DAYS = 90

let cachedKey: { secret: string; key: CryptoKey } | null = null

async function hmacKey(secret: string): Promise<CryptoKey> {
  if (cachedKey?.secret === secret) return cachedKey.key
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  cachedKey = { secret, key }
  return key
}

export async function pseudonymise(secret: string, uidc: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(uidc))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

const empty = (status: number) => new Response(null, { status })

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/api/event') return empty(404)
    if (request.method !== 'POST') return empty(405)

    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://wanitrack.com'
    if (request.headers.get('Origin') !== allowedOrigin) return empty(403)

    const declared = Number(request.headers.get('Content-Length') || '0')
    if (declared > MAX_EVENT_BYTES) return empty(413)
    const body = await request.text()
    if (body.length > MAX_EVENT_BYTES) return empty(413)

    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      return empty(400)
    }
    const event = validateEvent(parsed)
    if (!event) return empty(400)

    if (!env.UID_SECRET) return empty(500)

    const uid = 'uidc' in event && event.uidc ? await pseudonymise(env.UID_SECRET, event.uidc) : null
    if (uid && env.EXCLUDE_UIDS?.split(',').map((s) => s.trim()).includes(uid)) return empty(204)

    const day = new Date().toISOString().slice(0, 10)
    const writes = writesFor(event, day, uid)
    if (writes.length > 0) {
      await env.DB.batch(writes.map((w) => env.DB.prepare(w.sql).bind(...w.params)))
    }
    return empty(204)
  },

  // Daily cron: enforce the retention limit promised in the privacy notice
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString().slice(0, 10)
    await env.DB.batch([
      env.DB.prepare('DELETE FROM user_days WHERE day < ?').bind(cutoff),
      env.DB.prepare('DELETE FROM counters WHERE day < ?').bind(cutoff),
      env.DB.prepare(
        'DELETE FROM users WHERE uid NOT IN (SELECT DISTINCT uid FROM user_days)'
      ),
    ])
  },
}
