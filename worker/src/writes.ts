// Pure mapping from a validated event to the D1 statements it produces.
// Kept separate from the Worker entry so it can be unit-tested without D1.

import { pageBit, type AnalyticsEvent } from '../../src/lib/analytics/events'

export interface Write {
  sql: string
  params: (string | number)[]
}

const bumpCounter = (day: string, name: string): Write => ({
  sql: `INSERT INTO counters (day, name, n) VALUES (?, ?, 1)
        ON CONFLICT (day, name) DO UPDATE SET n = n + 1`,
  params: [day, name],
})

// First sighting wins. A `connect` on the user's first day upgrades the row to
// via_connect = 1 even if a `view`/`open` beacon from the same load happened
// to be processed first.
const seeUser = (day: string, uid: string, viaConnect: boolean): Write =>
  viaConnect
    ? {
        sql: `INSERT INTO users (uid, first_day, via_connect) VALUES (?, ?, 1)
              ON CONFLICT (uid) DO UPDATE SET via_connect = 1
              WHERE users.first_day = excluded.first_day`,
        params: [uid, day],
      }
    : {
        sql: `INSERT INTO users (uid, first_day, via_connect) VALUES (?, ?, 0)
              ON CONFLICT (uid) DO NOTHING`,
        params: [uid, day],
      }

const touchDay = (day: string, uid: string, opens: number, pages: number): Write => ({
  sql: `INSERT INTO user_days (day, uid, opens, pages) VALUES (?, ?, ?, ?)
        ON CONFLICT (day, uid) DO UPDATE SET opens = opens + excluded.opens,
                                             pages = pages | excluded.pages`,
  params: [day, uid, opens, pages],
})

/**
 * @param day  UTC date, YYYY-MM-DD
 * @param uid  server-side pseudonymous id (HMAC), or null when the event has none
 */
export function writesFor(event: AnalyticsEvent, day: string, uid: string | null): Write[] {
  switch (event.e) {
    case 'landing':
      return [bumpCounter(day, 'landing')]
    case 'connect_fail':
      return [bumpCounter(day, `connect_fail:${event.reason}`)]
    case 'connect':
      if (!uid) return []
      return [seeUser(day, uid, true), touchDay(day, uid, 0, 0), bumpCounter(day, 'connect_ok')]
    case 'open': {
      if (!uid) return []
      const writes = [seeUser(day, uid, false), touchDay(day, uid, 1, 0)]
      if (event.pwa) writes.push(bumpCounter(day, 'open_pwa'))
      if (!event.cached) writes.push(bumpCounter(day, 'open_uncached'))
      return writes
    }
    case 'view':
      if (!uid) return []
      return [seeUser(day, uid, false), touchDay(day, uid, 0, pageBit(event.page))]
    case 'error':
      return [bumpCounter(day, `error:${event.kind}:${event.status ?? 'na'}`)]
  }
}
