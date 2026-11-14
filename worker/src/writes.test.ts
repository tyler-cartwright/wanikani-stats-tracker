import { describe, expect, it } from 'vitest'
import { writesFor } from './writes'
import { pseudonymise } from './index'

const DAY = '2026-11-14'
const UID = 'f'.repeat(32)
const UIDC = 'a'.repeat(64)

const tables = (sqls: { sql: string }[]) =>
  sqls.map((w) => w.sql.match(/INSERT INTO (\w+)/)?.[1])

describe('writesFor', () => {
  it('counts landings and connect failures without any identifier', () => {
    const landing = writesFor({ e: 'landing', v: '1' }, DAY, null)
    expect(landing).toEqual([expect.objectContaining({ params: [DAY, 'landing'] })])

    const fail = writesFor({ e: 'connect_fail', v: '1', reason: 'invalid_token' }, DAY, null)
    expect(fail[0].params).toEqual([DAY, 'connect_fail:invalid_token'])
  })

  it('marks a connect as a new user and counts it', () => {
    const w = writesFor({ e: 'connect', v: '1', uidc: UIDC }, DAY, UID)
    expect(tables(w)).toEqual(['users', 'user_days', 'counters'])
    expect(w[0].sql).toContain('via_connect = 1')
    expect(w[0].sql).toContain('users.first_day = excluded.first_day')
    expect(w[2].params).toEqual([DAY, 'connect_ok'])
  })

  it('records an open with pwa and uncached counters', () => {
    const w = writesFor({ e: 'open', v: '1', uidc: UIDC, cached: false, pwa: true }, DAY, UID)
    expect(tables(w)).toEqual(['users', 'user_days', 'counters', 'counters'])
    expect(w[0].sql).toContain('DO NOTHING')
    expect(w[1].params).toEqual([DAY, UID, 1, 0])
    expect(w.slice(2).map((x) => x.params[1])).toEqual(['open_pwa', 'open_uncached'])
  })

  it('ORs the page bit into the user-day row', () => {
    const w = writesFor({ e: 'view', v: '1', uidc: UIDC, page: 'forecast' }, DAY, UID)
    expect(w[1].sql).toContain('pages = pages | excluded.pages')
    expect(w[1].params).toEqual([DAY, UID, 0, 16])
  })

  it('aggregates errors by kind and status only', () => {
    expect(writesFor({ e: 'error', v: '1', kind: 'auth', status: 401 }, DAY, UID)[0].params).toEqual([
      DAY,
      'error:auth:401',
    ])
    expect(writesFor({ e: 'error', v: '1', kind: 'crash' }, DAY, null)[0].params).toEqual([
      DAY,
      'error:crash:na',
    ])
  })

  it('writes nothing for identified events without a uid', () => {
    expect(writesFor({ e: 'view', v: '1', uidc: UIDC, page: 'kanji' }, DAY, null)).toEqual([])
  })
})

describe('pseudonymise', () => {
  it('is keyed: same input and secret agree, different secrets differ', async () => {
    const a = await pseudonymise('secret-1', UIDC)
    expect(a).toMatch(/^[0-9a-f]{32}$/)
    expect(await pseudonymise('secret-1', UIDC)).toBe(a)
    expect(await pseudonymise('secret-2', UIDC)).not.toBe(a)
    expect(a).not.toBe(UIDC.slice(0, 32))
  })
})
