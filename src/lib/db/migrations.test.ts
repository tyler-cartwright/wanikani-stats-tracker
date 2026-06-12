import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { runMigrations } from './migrations'
import { DB_NAME, STORES } from './schema'

/**
 * Opens a database at the given version against an isolated IDBFactory,
 * running the production migration path on upgrade. Each test uses its own
 * factory so state never leaks between tests.
 */
function openAt(factory: IDBFactory, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, version)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      try {
        runMigrations(request.result, event.oldVersion, version, request.transaction!)
      } catch (error) {
        request.transaction!.abort()
        reject(error)
      }
    }
  })
}

function put<T>(db: IDBDatabase, storeName: string, item: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function getAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const ALL_STORES = [
  STORES.SYNC_METADATA,
  STORES.SUBJECTS,
  STORES.ASSIGNMENTS,
  STORES.REVIEW_STATISTICS,
  STORES.LEVEL_PROGRESSIONS,
  STORES.API_SNAPSHOTS,
  STORES.ACTIVITY_HISTORY,
  STORES.TRAINER_SESSIONS,
]

describe('runMigrations', () => {
  it('creates all stores and indexes on a fresh install (0 -> 4)', async () => {
    const factory = new IDBFactory()
    const db = await openAt(factory, 4)

    expect(Array.from(db.objectStoreNames).sort()).toEqual([...ALL_STORES].sort())

    const tx = db.transaction(ALL_STORES, 'readonly')
    expect(Array.from(tx.objectStore(STORES.SUBJECTS).indexNames)).toEqual(['updatedAt'])
    expect(Array.from(tx.objectStore(STORES.ASSIGNMENTS).indexNames).sort()).toEqual([
      'subjectId',
      'updatedAt',
    ])
    expect(
      Array.from(tx.objectStore(STORES.REVIEW_STATISTICS).indexNames).sort()
    ).toEqual(['subjectId', 'updatedAt'])
    expect(
      Array.from(tx.objectStore(STORES.LEVEL_PROGRESSIONS).indexNames).sort()
    ).toEqual(['level', 'updatedAt'])
    expect(tx.objectStore(STORES.API_SNAPSHOTS).keyPath).toBe('endpoint')
    expect(tx.objectStore(STORES.ACTIVITY_HISTORY).keyPath).toBe('date')
    expect(tx.objectStore(STORES.TRAINER_SESSIONS).keyPath).toBe('id')
    expect(Array.from(tx.objectStore(STORES.TRAINER_SESSIONS).indexNames)).toEqual(['date'])

    db.close()
  })

  it('preserves all existing data when upgrading 1 -> 2', async () => {
    const factory = new IDBFactory()

    // Open at v1: migration 1 is the production 2.20.x schema verbatim.
    const v1 = await openAt(factory, 1)
    expect(Array.from(v1.objectStoreNames)).not.toContain(STORES.API_SNAPSHOTS)

    const subject = { id: 440, data: { slug: 'fish', level: 2 }, updatedAt: '2026-01-01T00:00:00Z' }
    const assignment = { id: 80463006, subjectId: 440, data: { srs_stage: 8 }, updatedAt: '2026-01-02T00:00:00Z' }
    const appVersion = { id: 'app_version', version: '2.20.1', lastChecked: '2026-01-03T00:00:00Z' }
    const syncMeta = { id: 'sync_metadata', subjectsUpdatedAt: '2026-01-01T00:00:00Z' }

    await put(v1, STORES.SUBJECTS, subject)
    await put(v1, STORES.ASSIGNMENTS, assignment)
    await put(v1, STORES.SYNC_METADATA, appVersion)
    await put(v1, STORES.SYNC_METADATA, syncMeta)
    v1.close()

    const v2 = await openAt(factory, 2)

    expect(await getAll(v2, STORES.SUBJECTS)).toEqual([subject])
    expect(await getAll(v2, STORES.ASSIGNMENTS)).toEqual([assignment])
    expect(await getAll(v2, STORES.SYNC_METADATA)).toEqual(
      expect.arrayContaining([appVersion, syncMeta])
    )
    expect(Array.from(v2.objectStoreNames)).toContain(STORES.API_SNAPSHOTS)
    expect(await getAll(v2, STORES.API_SNAPSHOTS)).toEqual([])

    v2.close()
  })

  it('preserves all existing data when upgrading 2 -> 3', async () => {
    const factory = new IDBFactory()

    const v2 = await openAt(factory, 2)
    expect(Array.from(v2.objectStoreNames)).not.toContain(STORES.ACTIVITY_HISTORY)

    const subject = { id: 440, data: { slug: 'fish', level: 2 }, updatedAt: '2026-01-01T00:00:00Z' }
    const stat = { id: 7, subjectId: 440, data: { meaning_correct: 12 }, updatedAt: '2026-01-02T00:00:00Z' }
    const snapshot = { endpoint: 'user', data: { level: 23 }, updatedAt: '2026-01-03T00:00:00Z' }

    await put(v2, STORES.SUBJECTS, subject)
    await put(v2, STORES.REVIEW_STATISTICS, stat)
    await put(v2, STORES.API_SNAPSHOTS, snapshot)
    v2.close()

    const v3 = await openAt(factory, 3)

    expect(await getAll(v3, STORES.SUBJECTS)).toEqual([subject])
    expect(await getAll(v3, STORES.REVIEW_STATISTICS)).toEqual([stat])
    expect(await getAll(v3, STORES.API_SNAPSHOTS)).toEqual([snapshot])
    expect(Array.from(v3.objectStoreNames)).toContain(STORES.ACTIVITY_HISTORY)
    expect(await getAll(v3, STORES.ACTIVITY_HISTORY)).toEqual([])

    v3.close()
  })

  it('preserves all existing data when upgrading 3 -> 4', async () => {
    const factory = new IDBFactory()

    const v3 = await openAt(factory, 3)
    expect(Array.from(v3.objectStoreNames)).not.toContain(STORES.TRAINER_SESSIONS)

    const subject = { id: 440, data: { slug: 'fish', level: 2 }, updatedAt: '2026-01-01T00:00:00Z' }
    const stat = { id: 7, subjectId: 440, data: { meaning_correct: 12 }, updatedAt: '2026-01-02T00:00:00Z' }
    // The irreplaceable store: a migration that loses this row loses the moat.
    const activityDay = {
      date: '2026-06-01',
      reviews: { meaningCorrect: 5, meaningIncorrect: 1, readingCorrect: 4, readingIncorrect: 2 },
      lessons: 3,
      srsSnapshot: null,
      updatedAt: '2026-06-01T12:00:00Z',
    }

    await put(v3, STORES.SUBJECTS, subject)
    await put(v3, STORES.REVIEW_STATISTICS, stat)
    await put(v3, STORES.ACTIVITY_HISTORY, activityDay)
    v3.close()

    const v4 = await openAt(factory, 4)

    expect(await getAll(v4, STORES.SUBJECTS)).toEqual([subject])
    expect(await getAll(v4, STORES.REVIEW_STATISTICS)).toEqual([stat])
    expect(await getAll(v4, STORES.ACTIVITY_HISTORY)).toEqual([activityDay])
    expect(Array.from(v4.objectStoreNames)).toContain(STORES.TRAINER_SESSIONS)
    expect(await getAll(v4, STORES.TRAINER_SESSIONS)).toEqual([])

    v4.close()
  })

  it('runs only the migrations in the requested range', () => {
    const created: string[] = []
    const fakeDb = {
      createObjectStore: (name: string) => {
        created.push(name)
        return { createIndex: () => undefined }
      },
    } as unknown as IDBDatabase

    runMigrations(fakeDb, 2, 3, {} as IDBTransaction)

    expect(created).toEqual([STORES.ACTIVITY_HISTORY])
  })

  it('throws loudly when a migration is missing for a version', () => {
    const fakeDb = {
      createObjectStore: () => ({ createIndex: () => undefined }),
    } as unknown as IDBDatabase

    expect(() => runMigrations(fakeDb, 0, 999, {} as IDBTransaction)).toThrow(
      /No migration defined for DB version 5/
    )
  })
})
