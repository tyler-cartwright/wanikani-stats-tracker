// src/lib/db/database.ts
import { runMigrations } from './migrations'
import { DB_NAME, DB_VERSION, STORES } from './schema'

export { STORES } from './schema'

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

export async function getDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Failed to open database:', request.error)
      dbPromise = null
      reject(request.error)
    }

    request.onblocked = () => {
      console.warn('[DB] Open blocked: another tab holds an older version of the database')
    }

    request.onsuccess = () => {
      dbInstance = request.result
      // If another tab upgrades to a newer DB version, release our connection
      // so its upgrade isn't blocked; the next access here reopens at the new
      // version.
      dbInstance.onversionchange = () => {
        dbInstance?.close()
        dbInstance = null
        dbPromise = null
      }
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      runMigrations(request.result, event.oldVersion, DB_VERSION, request.transaction!)
    }
  })

  return dbPromise
}

// Clears every store, including irreplaceable activity history — only valid
// for full logout. Anything else (force sync, version change) must use
// clearStores with an explicit list that spares the durable stores.
export async function clearDatabase(): Promise<void> {
  return clearStores(Object.values(STORES))
}

export async function clearStores(storeNames: string[]): Promise<void> {
  const db = await getDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, 'readwrite')

    // Wait for transaction to complete
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))

    // Clear the requested stores
    storeNames.forEach((storeName) => {
      tx.objectStore(storeName).clear()
    })
  })
}

export async function getMany<T>(
  storeName: string,
  ids: (number | string)[]
): Promise<(T | undefined)[]> {
  if (ids.length === 0) return []

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const results = new Array<T | undefined>(ids.length)

    ids.forEach((id, index) => {
      const request = store.get(id)
      request.onsuccess = () => {
        results[index] = request.result
      }
    })

    tx.oncomplete = () => resolve(results)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))
  })
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

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    // Wait for transaction to complete, not individual operations
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(new Error('Transaction aborted'))

    // Queue all put operations
    items.forEach((item) => {
      store.put(item)
    })
  })
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
