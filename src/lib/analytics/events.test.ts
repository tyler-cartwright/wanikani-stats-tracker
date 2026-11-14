import { describe, expect, it } from 'vitest'
import { connectFailReason, pageBit, pageFromPath, PAGES, validateEvent } from './events'

const UIDC = 'a'.repeat(64)

describe('pageFromPath', () => {
  it('maps every routed path to its page', () => {
    expect(pageFromPath('/')).toBe('dashboard')
    expect(pageFromPath('/kanji')).toBe('kanji')
    expect(pageFromPath('/trainer')).toBe('trainer')
    expect(pageFromPath('/jlpt')).toBe('readiness')
    expect(pageFromPath('/settings/')).toBe('settings')
  })

  it('returns null for unknown paths', () => {
    expect(pageFromPath('/nope')).toBeNull()
    expect(pageFromPath('/kanji/extra')).toBeNull()
  })
})

describe('pageBit', () => {
  it('gives each page a distinct power of two that fits in 31 bits', () => {
    const bits = PAGES.map(pageBit)
    expect(new Set(bits).size).toBe(PAGES.length)
    bits.forEach((bit) => expect(bit > 0 && (bit & (bit - 1)) === 0).toBe(true))
    expect(PAGES.length).toBeLessThanOrEqual(31)
  })

  it('pins the existing bit order (append-only)', () => {
    expect(pageBit('dashboard')).toBe(1)
    expect(pageBit('settings')).toBe(512)
  })
})

describe('validateEvent', () => {
  it('accepts each well-formed event', () => {
    expect(validateEvent({ e: 'landing', v: '2.25.1' })).toEqual({ e: 'landing', v: '2.25.1' })
    expect(validateEvent({ e: 'connect', v: '1', uidc: UIDC })).toEqual({ e: 'connect', v: '1', uidc: UIDC })
    expect(validateEvent({ e: 'connect_fail', v: '1', reason: 'network' })).not.toBeNull()
    expect(validateEvent({ e: 'open', v: '1', uidc: UIDC, cached: true, pwa: false })).not.toBeNull()
    expect(validateEvent({ e: 'view', v: '1', uidc: UIDC, page: 'kanji' })).not.toBeNull()
    expect(validateEvent({ e: 'error', v: '1', kind: 'sync' })).toEqual({ e: 'error', v: '1', kind: 'sync' })
    expect(validateEvent({ e: 'error', v: '1', kind: 'auth', status: 401, uidc: UIDC })).toEqual({
      e: 'error',
      v: '1',
      kind: 'auth',
      status: 401,
      uidc: UIDC,
    })
  })

  it('strips unknown fields so they can never be stored', () => {
    const result = validateEvent({ e: 'view', v: '1', uidc: UIDC, page: 'kanji', username: 'koichi', token: 'x' })
    expect(result).toEqual({ e: 'view', v: '1', uidc: UIDC, page: 'kanji' })
  })

  it('rejects malformed input', () => {
    const bad: unknown[] = [
      null,
      [],
      'landing',
      { e: 'landing' }, // no version
      { e: 'landing', v: '<script>' },
      { e: 'unknown', v: '1' },
      { e: 'connect', v: '1' }, // no uidc
      { e: 'connect', v: '1', uidc: 'not-a-hash' },
      { e: 'connect', v: '1', uidc: 'A'.repeat(64) }, // uppercase is not our format
      { e: 'connect_fail', v: '1', reason: 'because' },
      { e: 'open', v: '1', uidc: UIDC, cached: 'yes', pwa: false },
      { e: 'view', v: '1', uidc: UIDC, page: '/kanji' },
      { e: 'error', v: '1', kind: 'boom' },
      { e: 'error', v: '1', kind: 'sync', status: 9999 },
      { e: 'error', v: '1', kind: 'sync', status: 1.5 },
      { e: 'error', v: '1', kind: 'sync', uidc: 'short' },
    ]
    bad.forEach((raw) => expect(validateEvent(raw)).toBeNull())
  })
})

describe('connectFailReason', () => {
  it('classifies WaniKani API statuses', () => {
    expect(connectFailReason(0)).toBe('network')
    expect(connectFailReason(401)).toBe('invalid_token')
    expect(connectFailReason(429)).toBe('rate_limited')
    expect(connectFailReason(503)).toBe('server')
    expect(connectFailReason(403)).toBe('other')
    expect(connectFailReason(undefined)).toBe('other')
  })
})
