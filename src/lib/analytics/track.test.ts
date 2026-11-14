import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const USER_UUID = '5a6a5234-a392-4a87-8f3f-33342afe8a42'
const TOKEN = 'secret-api-token-0000'

type TrackModule = typeof import('./track')

/** Fresh module instance with the given endpoint baked in (it's read at load time). */
async function loadTrack(endpoint: string | undefined): Promise<TrackModule> {
  vi.resetModules()
  vi.stubEnv('VITE_ANALYTICS_ENDPOINT', endpoint ?? '')
  return import('./track')
}

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

let beacons: string[]

beforeEach(() => {
  beacons = []
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('navigator', {
    onLine: true,
    sendBeacon: (_url: string, blob: Blob) => {
      blob.text().then((t) => beacons.push(t))
      return true
    },
  })
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('hashUserId', () => {
  it('is a deterministic 64-char hex digest that does not contain the id', async () => {
    const { hashUserId } = await loadTrack(undefined)
    const a = await hashUserId(USER_UUID)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(await hashUserId(USER_UUID)).toBe(a)
    expect(a).not.toContain(USER_UUID.replace(/-/g, ''))
    expect(await hashUserId('other-user')).not.toBe(a)
  })
})

describe('track', () => {
  it('sends nothing when no endpoint is configured', async () => {
    const t = await loadTrack(undefined)
    t.trackLanding()
    t.track({ e: 'connect_fail', reason: 'network' })
    await flush()
    expect(beacons).toEqual([])
  })

  it('sends versioned events with only the digest — never the token or uuid', async () => {
    const t = await loadTrack('/api/event')
    const uidc = await t.identify(USER_UUID)
    t.track({ e: 'connect', uidc })
    t.trackOpen(true)
    t.track({ e: 'view', uidc, page: 'kanji' })
    t.trackError('sync', 500)
    await flush()

    expect(beacons).toHaveLength(4)
    for (const body of beacons) {
      expect(body).not.toContain(TOKEN)
      expect(body).not.toContain(USER_UUID)
      expect(JSON.parse(body).v).toBeTruthy()
    }
    expect(JSON.parse(beacons[1])).toMatchObject({ e: 'open', uidc, cached: true, pwa: false })
    expect(JSON.parse(beacons[3])).toMatchObject({ e: 'error', kind: 'sync', status: 500, uidc })
  })

  it('sends landing and open at most once per page load', async () => {
    const t = await loadTrack('/api/event')
    t.trackLanding()
    t.trackLanding()
    await t.identify(USER_UUID)
    t.trackOpen(false)
    t.trackOpen(false)
    await flush()
    expect(beacons.map((b) => JSON.parse(b).e)).toEqual(['landing', 'open'])
  })

  it('does not send open before the user is identified', async () => {
    const t = await loadTrack('/api/event')
    t.trackOpen(true)
    await flush()
    expect(beacons).toEqual([])
  })

  it('honours the opt-out, and resumes when it is cleared', async () => {
    const t = await loadTrack('/api/event')
    t.setAnalyticsOptOut(true)
    expect(t.getAnalyticsOptOut()).toBe(true)
    t.track({ e: 'landing' })
    await flush()
    expect(beacons).toEqual([])

    t.setAnalyticsOptOut(false)
    t.track({ e: 'landing' })
    await flush()
    expect(beacons).toHaveLength(1)
  })

  it('notifies opt-out subscribers', async () => {
    const t = await loadTrack('/api/event')
    const listener = vi.fn()
    const unsubscribe = t.subscribeAnalyticsOptOut(listener)
    t.setAnalyticsOptOut(true)
    unsubscribe()
    t.setAnalyticsOptOut(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('honours Global Privacy Control', async () => {
    const t = await loadTrack('/api/event')
    vi.stubGlobal('navigator', { onLine: true, globalPrivacyControl: true, sendBeacon: () => true })
    expect(t.analyticsEnabled()).toBe(false)
  })

  it('does not report errors while offline', async () => {
    const t = await loadTrack('/api/event')
    const sendBeacon = vi.fn(() => true)
    vi.stubGlobal('navigator', { onLine: false, sendBeacon })
    t.trackError('sync')
    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it('drops the identity on logout', async () => {
    const t = await loadTrack('/api/event')
    await t.identify(USER_UUID)
    t.resetIdentity()
    expect(t.currentUserDigest()).toBeNull()
    t.trackError('crash')
    await flush()
    expect(JSON.parse(beacons[0])).not.toHaveProperty('uidc')
  })

  it('never throws when sending fails', async () => {
    const t = await loadTrack('/api/event')
    vi.stubGlobal('navigator', {
      onLine: true,
      sendBeacon: () => {
        throw new Error('blocked')
      },
    })
    expect(() => t.track({ e: 'landing' })).not.toThrow()
  })
})
