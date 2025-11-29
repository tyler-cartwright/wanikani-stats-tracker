// src/lib/db/database.ts
import { DB_NAME, DB_VERSION, STORES } from './schema'

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

export async function getDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Failed to open database:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Sync metadata store (singleton pattern)
      if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'id' })
      }

      // Subjects store
      if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
        const subjectsStore = db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' })
        subjectsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Assignments store
      if (!db.objectStoreNames.contains(STORES.ASSIGNMENTS)) {
        const assignmentsStore = db.createObjectStore(STORES.ASSIGNMENTS, { keyPath: 'id' })
        assignmentsStore.createIndex('subjectId', 'subjectId', { unique: false })
        assignmentsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Review statistics store
      if (!db.objectStoreNames.contains(STORES.REVIEW_STATISTICS)) {
        const statsStore = db.createObjectStore(STORES.REVIEW_STATISTICS, { keyPath: 'id' })
        statsStore.createIndex('subjectId', 'subjectId', { unique: false })
        statsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Level progressions store
      if (!db.objectStoreNames.contains(STORES.LEVEL_PROGRESSIONS)) {
        const progressionsStore = db.createObjectStore(STORES.LEVEL_PROGRESSIONS, { keyPath: 'id' })
        progressionsStore.createIndex('level', 'level', { unique: false })
        progressionsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
  })

  return dbPromise
}

export async function clearDatabase(): Promise<void> {
  const db = await getDatabase()
  const storeNames = Object.values(STORES)

  const tx = db.transaction(storeNames, 'readwrite')

  await Promise.all(
    storeNames.map(
      (storeName) =>
        new Promise<void>((resolve, reject) => {
          const request = tx.objectStore(storeName).clear()
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
    )
  )
}

// Generic store operations
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getById<T>(storeName: string, id: number | string): Promise<T | undefined> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function putMany<T>(storeName: string, items: T[]): Promise<void> {
  if (items.length === 0) return

  const db = await getDatabase()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)

  await Promise.all(
    items.map(
      (item) =>
        new Promise<void>((resolve, reject) => {
          const request = store.put(item)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
    )
  )
}

export async function putOne<T>(storeName: string, item: T): Promise<void> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(item)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteById(storeName: string, id: number | string): Promise<void> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function count(storeName: string): Promise<number> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
