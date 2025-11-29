# WaniTrack v2.1.0 Implementation Plan
## IndexedDB Persistence & Delta Sync

### Overview

This plan transforms WaniTrack from a "fetch everything on load" architecture to a "persist locally, sync intelligently" architecture. The result is instant app loading, reduced API calls by ~90%, and proper offline support.

**Key Constraints:**
- The `/reviews` endpoint is **deprecated** and must be removed entirely
- WaniKani rate limit: 60 requests/minute
- Must preserve existing UI/UX while improving performance

---

## Phase 1: Remove Deprecated Reviews Endpoint

### Files to Modify

#### 1.1 Remove from `src/lib/api/endpoints.ts`

Delete the entire `fetchReviews` function:

```typescript
// DELETE THIS ENTIRE FUNCTION
export async function fetchReviews(
  token: string,
  limit: number = 1000,
  onProgress?: (current: number, total: number) => void
): Promise<(Review & { id: number })[]> {
  // ... entire function
}
```

#### 1.2 Remove from `src/lib/api/queries.ts`

Delete:
- The `reviews` query key from `queryKeys`
- The entire `useReviews` hook
- Remove `reviews` from any prefetch functions if present

```typescript
// DELETE from queryKeys:
reviews: ['reviews'] as const,

// DELETE entire hook:
export function useReviews() { ... }
```

#### 1.3 Remove from `src/lib/api/types.ts`

Keep the `Review` interface (it's still used by review_statistics conceptually), but note we won't be fetching individual reviews anymore.

#### 1.4 Update any components using `useReviews`

Search codebase for `useReviews` - currently appears unused in components, but verify. If any component uses it, refactor to use `useReviewStatistics` instead.

---

## Phase 2: Set Up IndexedDB Infrastructure

### 2.1 Create Database Schema

Create new file: `src/lib/db/schema.ts`

```typescript
// src/lib/db/schema.ts
export const DB_NAME = 'wanitrack'
export const DB_VERSION = 1

export interface SyncMetadata {
  id: string // 'sync_metadata' - singleton
  subjectsUpdatedAt: string | null
  assignmentsUpdatedAt: string | null
  reviewStatisticsUpdatedAt: string | null
  levelProgressionsUpdatedAt: string | null
  lastFullSync: string | null
}

export interface CachedSubject {
  id: number
  data: any // The full subject data
  updatedAt: string
}

export interface CachedAssignment {
  id: number
  subjectId: number
  data: any
  updatedAt: string
}

export interface CachedReviewStatistic {
  id: number
  subjectId: number
  data: any
  updatedAt: string
}

export interface CachedLevelProgression {
  id: number
  level: number
  data: any
  updatedAt: string
}

export const STORES = {
  SYNC_METADATA: 'sync_metadata',
  SUBJECTS: 'subjects',
  ASSIGNMENTS: 'assignments',
  REVIEW_STATISTICS: 'review_statistics',
  LEVEL_PROGRESSIONS: 'level_progressions',
} as const
```

### 2.2 Create Database Manager

Create new file: `src/lib/db/database.ts`

```typescript
// src/lib/db/database.ts
import { DB_NAME, DB_VERSION, STORES, type SyncMetadata } from './schema'

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
```

### 2.3 Create Sync Metadata Helper

Create new file: `src/lib/db/sync-metadata.ts`

```typescript
// src/lib/db/sync-metadata.ts
import { getById, putOne } from './database'
import { STORES, type SyncMetadata } from './schema'

const METADATA_ID = 'sync_metadata'

const DEFAULT_METADATA: SyncMetadata = {
  id: METADATA_ID,
  subjectsUpdatedAt: null,
  assignmentsUpdatedAt: null,
  reviewStatisticsUpdatedAt: null,
  levelProgressionsUpdatedAt: null,
  lastFullSync: null,
}

export async function getSyncMetadata(): Promise<SyncMetadata> {
  const metadata = await getById<SyncMetadata>(STORES.SYNC_METADATA, METADATA_ID)
  return metadata ?? DEFAULT_METADATA
}

export async function updateSyncMetadata(
  updates: Partial<Omit<SyncMetadata, 'id'>>
): Promise<void> {
  const current = await getSyncMetadata()
  await putOne(STORES.SYNC_METADATA, { ...current, ...updates })
}

export async function resetSyncMetadata(): Promise<void> {
  await putOne(STORES.SYNC_METADATA, DEFAULT_METADATA)
}
```

---

## Phase 3: Create Data Repository Layer

This layer abstracts IndexedDB operations and provides clean interfaces for the query hooks.

### 3.1 Create Subjects Repository

Create new file: `src/lib/db/repositories/subjects.ts`

```typescript
// src/lib/db/repositories/subjects.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchSubjects } from '@/lib/api/endpoints'
import type { Subject } from '@/lib/api/types'

export interface CachedSubject {
  id: number
  data: Subject
  updatedAt: string
}

export async function getCachedSubjects(): Promise<(Subject & { id: number })[]> {
  const cached = await getAll<CachedSubject>(STORES.SUBJECTS)
  return cached.map((item) => ({ ...item.data, id: item.id }))
}

export async function getSubjectCount(): Promise<number> {
  return count(STORES.SUBJECTS)
}

export async function syncSubjects(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getSubjectCount()
  
  // Determine if we need a full sync or delta sync
  const isFullSync = cachedCount === 0 || !metadata.subjectsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.subjectsUpdatedAt

  onProgress?.(isFullSync ? 'Fetching all subjects...' : 'Checking for subject updates...')

  // Build endpoint with updated_after if doing delta sync
  const subjects = await fetchSubjectsWithFilter(token, updatedAfter)

  if (subjects.length === 0) {
    onProgress?.('Subjects up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${subjects.length} subjects...`)

  // Transform to cached format
  const cachedSubjects: CachedSubject[] = subjects.map((subject) => ({
    id: subject.id,
    data: subject,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.SUBJECTS, cachedSubjects)

  // Update sync metadata
  await updateSyncMetadata({
    subjectsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${subjects.length} subjects`)
  return { updated: subjects.length, isFullSync }
}

// Helper to fetch with updated_after filter
async function fetchSubjectsWithFilter(
  token: string,
  updatedAfter?: string | null
): Promise<(Subject & { id: number })[]> {
  // Note: This requires modifying fetchSubjects to accept updated_after
  // See Phase 4 for API layer updates
  return fetchSubjects(token, updatedAfter ?? undefined)
}
```

### 3.2 Create Assignments Repository

Create new file: `src/lib/db/repositories/assignments.ts`

```typescript
// src/lib/db/repositories/assignments.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchAssignments } from '@/lib/api/endpoints'
import type { Assignment } from '@/lib/api/types'

export interface CachedAssignment {
  id: number
  subjectId: number
  data: Assignment
  updatedAt: string
}

export async function getCachedAssignments(): Promise<Assignment[]> {
  const cached = await getAll<CachedAssignment>(STORES.ASSIGNMENTS)
  return cached.map((item) => item.data)
}

export async function getAssignmentCount(): Promise<number> {
  return count(STORES.ASSIGNMENTS)
}

export async function syncAssignments(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getAssignmentCount()
  
  const isFullSync = cachedCount === 0 || !metadata.assignmentsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.assignmentsUpdatedAt

  onProgress?.(isFullSync ? 'Fetching all assignments...' : 'Checking for assignment updates...')

  const assignments = await fetchAssignments(token, updatedAfter ?? undefined)

  if (assignments.length === 0) {
    onProgress?.('Assignments up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${assignments.length} assignments...`)

  // Need to extract ID from the fetched data
  // Note: fetchAssignments returns Assignment[], but we need IDs
  // See Phase 4 for API modifications
  const cachedAssignments: CachedAssignment[] = assignments.map((assignment: any) => ({
    id: assignment.id,
    subjectId: assignment.subject_id,
    data: assignment,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.ASSIGNMENTS, cachedAssignments)

  await updateSyncMetadata({
    assignmentsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${assignments.length} assignments`)
  return { updated: assignments.length, isFullSync }
}
```

### 3.3 Create Review Statistics Repository

Create new file: `src/lib/db/repositories/review-statistics.ts`

```typescript
// src/lib/db/repositories/review-statistics.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchReviewStatistics } from '@/lib/api/endpoints'
import type { ReviewStatistic } from '@/lib/api/types'

export interface CachedReviewStatistic {
  id: number
  subjectId: number
  data: ReviewStatistic
  updatedAt: string
}

export async function getCachedReviewStatistics(): Promise<ReviewStatistic[]> {
  const cached = await getAll<CachedReviewStatistic>(STORES.REVIEW_STATISTICS)
  return cached.map((item) => item.data)
}

export async function getReviewStatisticCount(): Promise<number> {
  return count(STORES.REVIEW_STATISTICS)
}

export async function syncReviewStatistics(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getReviewStatisticCount()
  
  const isFullSync = cachedCount === 0 || !metadata.reviewStatisticsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.reviewStatisticsUpdatedAt

  onProgress?.(
    isFullSync ? 'Fetching all review statistics...' : 'Checking for review statistic updates...'
  )

  const stats = await fetchReviewStatistics(token, updatedAfter ?? undefined)

  if (stats.length === 0) {
    onProgress?.('Review statistics up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${stats.length} review statistics...`)

  const cachedStats: CachedReviewStatistic[] = stats.map((stat: any) => ({
    id: stat.id,
    subjectId: stat.subject_id,
    data: stat,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.REVIEW_STATISTICS, cachedStats)

  await updateSyncMetadata({
    reviewStatisticsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${stats.length} review statistics`)
  return { updated: stats.length, isFullSync }
}
```

### 3.4 Create Level Progressions Repository

Create new file: `src/lib/db/repositories/level-progressions.ts`

```typescript
// src/lib/db/repositories/level-progressions.ts
import { getAll, putMany, count } from '../database'
import { STORES } from '../schema'
import { getSyncMetadata, updateSyncMetadata } from '../sync-metadata'
import { fetchLevelProgressions } from '@/lib/api/endpoints'
import type { LevelProgression } from '@/lib/api/types'

export interface CachedLevelProgression {
  id: number
  level: number
  data: LevelProgression
  updatedAt: string
}

export async function getCachedLevelProgressions(): Promise<LevelProgression[]> {
  const cached = await getAll<CachedLevelProgression>(STORES.LEVEL_PROGRESSIONS)
  return cached.map((item) => item.data)
}

export async function getLevelProgressionCount(): Promise<number> {
  return count(STORES.LEVEL_PROGRESSIONS)
}

export async function syncLevelProgressions(
  token: string,
  onProgress?: (message: string) => void
): Promise<{ updated: number; isFullSync: boolean }> {
  const metadata = await getSyncMetadata()
  const cachedCount = await getLevelProgressionCount()
  
  const isFullSync = cachedCount === 0 || !metadata.levelProgressionsUpdatedAt
  const updatedAfter = isFullSync ? undefined : metadata.levelProgressionsUpdatedAt

  onProgress?.(
    isFullSync ? 'Fetching level progressions...' : 'Checking for level progression updates...'
  )

  const progressions = await fetchLevelProgressions(token, updatedAfter ?? undefined)

  if (progressions.length === 0) {
    onProgress?.('Level progressions up to date')
    return { updated: 0, isFullSync }
  }

  onProgress?.(`Saving ${progressions.length} level progressions...`)

  const cachedProgressions: CachedLevelProgression[] = progressions.map((prog: any) => ({
    id: prog.id,
    level: prog.level,
    data: prog,
    updatedAt: new Date().toISOString(),
  }))

  await putMany(STORES.LEVEL_PROGRESSIONS, cachedProgressions)

  await updateSyncMetadata({
    levelProgressionsUpdatedAt: new Date().toISOString(),
  })

  onProgress?.(`Updated ${progressions.length} level progressions`)
  return { updated: progressions.length, isFullSync }
}
```

### 3.5 Create Repository Index

Create new file: `src/lib/db/repositories/index.ts`

```typescript
// src/lib/db/repositories/index.ts
export * from './subjects'
export * from './assignments'
export * from './review-statistics'
export * from './level-progressions'
```

---

## Phase 4: Update API Layer for Delta Sync

### 4.1 Modify `src/lib/api/endpoints.ts`

Update all fetch functions to accept `updatedAfter` parameter:

```typescript
// src/lib/api/endpoints.ts

/**
 * Fetch all subjects with optional updated_after filter
 */
export async function fetchSubjects(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(Subject & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/subjects?${params}` : '/subjects'
  return fetchAllPages<Subject>(endpoint, token, onProgress)
}

/**
 * Fetch all assignments with optional updated_after filter
 */
export async function fetchAssignments(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(Assignment & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/assignments?${params}` : '/assignments'
  return fetchAllPages<Assignment>(endpoint, token, onProgress)
}

/**
 * Fetch all review statistics with optional updated_after filter
 */
export async function fetchReviewStatistics(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(ReviewStatistic & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/review_statistics?${params}` : '/review_statistics'
  return fetchAllPages<ReviewStatistic>(endpoint, token, onProgress)
}

/**
 * Fetch all level progressions with optional updated_after filter
 */
export async function fetchLevelProgressions(
  token: string,
  updatedAfter?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(LevelProgression & { id: number })[]> {
  const params = new URLSearchParams()
  if (updatedAfter) {
    params.append('updated_after', updatedAfter)
  }
  const endpoint = params.toString() ? `/level_progressions?${params}` : '/level_progressions'
  return fetchAllPages<LevelProgression>(endpoint, token, onProgress)
}

// DELETE the fetchReviews function entirely
```

### 4.2 Update `src/lib/api/client.ts`

Ensure `fetchAllPages` returns items with IDs (it already does, but verify):

```typescript
// The existing fetchAllPages already merges id into the data object
// Just verify this line exists in the function:
const pageData = collection.data.map((resource) => ({
  ...resource.data,
  id: resource.id,
}))
```

---

## Phase 5: Create Sync Service

### 5.1 Create Sync Manager

Create new file: `src/lib/sync/sync-manager.ts`

```typescript
// src/lib/sync/sync-manager.ts
import { syncSubjects } from '@/lib/db/repositories/subjects'
import { syncAssignments } from '@/lib/db/repositories/assignments'
import { syncReviewStatistics } from '@/lib/db/repositories/review-statistics'
import { syncLevelProgressions } from '@/lib/db/repositories/level-progressions'
import { updateSyncMetadata, getSyncMetadata } from '@/lib/db/sync-metadata'
import { clearDatabase } from '@/lib/db/database'

export interface SyncProgress {
  phase: 'idle' | 'subjects' | 'assignments' | 'reviewStats' | 'levelProgressions' | 'complete' | 'error'
  message: string
  isFullSync: boolean
}

export interface SyncResult {
  success: boolean
  subjects: number
  assignments: number
  reviewStatistics: number
  levelProgressions: number
  isFullSync: boolean
  error?: string
}

export type SyncProgressCallback = (progress: SyncProgress) => void

/**
 * Performs a full or delta sync of all data
 */
export async function performSync(
  token: string,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    subjects: 0,
    assignments: 0,
    reviewStatistics: 0,
    levelProgressions: 0,
    isFullSync: false,
  }

  try {
    // Sync subjects first (they're the foundation)
    onProgress?.({ phase: 'subjects', message: 'Syncing subjects...', isFullSync: false })
    const subjectsResult = await syncSubjects(token, (msg) =>
      onProgress?.({ phase: 'subjects', message: msg, isFullSync: subjectsResult?.isFullSync ?? false })
    )
    result.subjects = subjectsResult.updated
    result.isFullSync = subjectsResult.isFullSync

    // Sync assignments
    onProgress?.({ phase: 'assignments', message: 'Syncing assignments...', isFullSync: result.isFullSync })
    const assignmentsResult = await syncAssignments(token, (msg) =>
      onProgress?.({ phase: 'assignments', message: msg, isFullSync: result.isFullSync })
    )
    result.assignments = assignmentsResult.updated

    // Sync review statistics
    onProgress?.({ phase: 'reviewStats', message: 'Syncing review statistics...', isFullSync: result.isFullSync })
    const statsResult = await syncReviewStatistics(token, (msg) =>
      onProgress?.({ phase: 'reviewStats', message: msg, isFullSync: result.isFullSync })
    )
    result.reviewStatistics = statsResult.updated

    // Sync level progressions
    onProgress?.({ phase: 'levelProgressions', message: 'Syncing level progressions...', isFullSync: result.isFullSync })
    const progressionsResult = await syncLevelProgressions(token, (msg) =>
      onProgress?.({ phase: 'levelProgressions', message: msg, isFullSync: result.isFullSync })
    )
    result.levelProgressions = progressionsResult.updated

    // Update last full sync time
    await updateSyncMetadata({
      lastFullSync: new Date().toISOString(),
    })

    result.success = true
    onProgress?.({ phase: 'complete', message: 'Sync complete', isFullSync: result.isFullSync })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.error = errorMessage
    onProgress?.({ phase: 'error', message: errorMessage, isFullSync: result.isFullSync })
    return result
  }
}

/**
 * Forces a complete resync by clearing the database first
 */
export async function forceFullSync(
  token: string,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  onProgress?.({ phase: 'idle', message: 'Clearing local data...', isFullSync: true })
  await clearDatabase()
  return performSync(token, onProgress)
}

/**
 * Gets info about the last sync
 */
export async function getLastSyncInfo(): Promise<{
  lastSync: Date | null
  hasData: boolean
}> {
  const metadata = await getSyncMetadata()
  return {
    lastSync: metadata.lastFullSync ? new Date(metadata.lastFullSync) : null,
    hasData: !!metadata.subjectsUpdatedAt,
  }
}
```

---

## Phase 6: Create Sync Store & Hook

### 6.1 Create Sync Store

Create new file: `src/stores/sync-store.ts`

```typescript
// src/stores/sync-store.ts
import { create } from 'zustand'
import type { SyncProgress, SyncResult } from '@/lib/sync/sync-manager'

interface SyncState {
  // State
  isSyncing: boolean
  lastSyncAt: Date | null
  lastSyncResult: SyncResult | null
  progress: SyncProgress | null
  error: string | null

  // Actions
  setSyncing: (isSyncing: boolean) => void
  setProgress: (progress: SyncProgress | null) => void
  setLastSync: (result: SyncResult) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  lastSyncResult: null,
  progress: null,
  error: null,

  setSyncing: (isSyncing) => set({ isSyncing }),
  setProgress: (progress) => set({ progress }),
  setLastSync: (result) =>
    set({
      lastSyncAt: new Date(),
      lastSyncResult: result,
      error: result.error ?? null,
    }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      isSyncing: false,
      lastSyncAt: null,
      lastSyncResult: null,
      progress: null,
      error: null,
    }),
}))
```

### 6.2 Create useSync Hook

Create new file: `src/hooks/use-sync.ts`

```typescript
// src/hooks/use-sync.ts
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncStore } from '@/stores/sync-store'
import { useUserStore } from '@/stores/user-store'
import { performSync, forceFullSync, getLastSyncInfo } from '@/lib/sync/sync-manager'
import { queryKeys } from '@/lib/api/queries'

export function useSync() {
  const queryClient = useQueryClient()
  const token = useUserStore((state) => state.token)
  const { isSyncing, lastSyncAt, progress, error, setSyncing, setProgress, setLastSync, setError } =
    useSyncStore()

  const sync = useCallback(
    async (force = false) => {
      if (!token || isSyncing) return

      setSyncing(true)
      setError(null)

      try {
        const syncFn = force ? forceFullSync : performSync
        const result = await syncFn(token, setProgress)

        setLastSync(result)

        // Invalidate all queries to pick up new data
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
          await queryClient.invalidateQueries({ queryKey: queryKeys.assignments })
          await queryClient.invalidateQueries({ queryKey: queryKeys.reviewStatistics })
          await queryClient.invalidateQueries({ queryKey: queryKeys.levelProgressions })
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed'
        setError(errorMessage)
        throw err
      } finally {
        setSyncing(false)
        setProgress(null)
      }
    },
    [token, isSyncing, queryClient, setSyncing, setProgress, setLastSync, setError]
  )

  const checkSyncStatus = useCallback(async () => {
    return getLastSyncInfo()
  }, [])

  return {
    sync,
    forceSync: () => sync(true),
    checkSyncStatus,
    isSyncing,
    lastSyncAt,
    progress,
    error,
  }
}
```

---

## Phase 7: Update Query Hooks to Use Cached Data

### 7.1 Rewrite `src/lib/api/queries.ts`

Replace the existing query hooks to use IndexedDB as the primary source:

```typescript
// src/lib/api/queries.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUserStore } from '@/stores/user-store'
import { useSyncStore } from '@/stores/sync-store'
import { fetchUser, fetchSummary } from './endpoints'
import { getCachedSubjects } from '@/lib/db/repositories/subjects'
import { getCachedAssignments } from '@/lib/db/repositories/assignments'
import { getCachedReviewStatistics } from '@/lib/db/repositories/review-statistics'
import { getCachedLevelProgressions } from '@/lib/db/repositories/level-progressions'
import { getLastSyncInfo } from '@/lib/sync/sync-manager'

export const queryKeys = {
  user: ['user'] as const,
  assignments: ['assignments'] as const,
  subjects: ['subjects'] as const,
  levelProgressions: ['levelProgressions'] as const,
  reviewStatistics: ['reviewStatistics'] as const,
  summary: ['summary'] as const,
  syncStatus: ['syncStatus'] as const,
}

/**
 * User - always fetched fresh (small payload, important to be current)
 */
export function useUser() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchUser(token)
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Summary - always fetched fresh (changes hourly, small payload)
 */
export function useSummary() {
  const token = useUserStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.summary,
    queryFn: () => {
      if (!token) throw new Error('No API token available')
      return fetchSummary(token)
    },
    enabled: !!token,
    staleTime: 10 * 1000,
    gcTime: 60 * 1000,
    refetchInterval: 30 * 1000,
    retry: 1,
  })
}

/**
 * Subjects - loaded from IndexedDB cache
 */
export function useSubjects() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: getCachedSubjects,
    enabled: !!token && !isSyncing,
    staleTime: Infinity, // Never stale - we control freshness via sync
    gcTime: Infinity,
    retry: 1,
  })
}

/**
 * Assignments - loaded from IndexedDB cache
 */
export function useAssignments() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: getCachedAssignments,
    enabled: !!token && !isSyncing,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}

/**
 * Review Statistics - loaded from IndexedDB cache
 */
export function useReviewStatistics() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.reviewStatistics,
    queryFn: getCachedReviewStatistics,
    enabled: !!token && !isSyncing,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}

/**
 * Level Progressions - loaded from IndexedDB cache
 */
export function useLevelProgressions() {
  const token = useUserStore((state) => state.token)
  const isSyncing = useSyncStore((state) => state.isSyncing)

  return useQuery({
    queryKey: queryKeys.levelProgressions,
    queryFn: getCachedLevelProgressions,
    enabled: !!token && !isSyncing,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}

/**
 * Sync Status - check if we have cached data
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: queryKeys.syncStatus,
    queryFn: getLastSyncInfo,
    staleTime: 0,
    gcTime: 0,
  })
}
```

---

## Phase 8: Update App Initialization Flow

### 8.1 Create Initial Sync Component

Create new file: `src/components/shared/initial-sync.tsx`

```typescript
// src/components/shared/initial-sync.tsx
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { useSyncStatus } from '@/lib/api/queries'

interface InitialSyncProps {
  children: React.ReactNode
}

export function InitialSync({ children }: InitialSyncProps) {
  const { sync, isSyncing, progress, error } = useSync()
  const { data: syncStatus, isLoading: checkingStatus } = useSyncStatus()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function initialize() {
      if (checkingStatus || initialized) return

      // If we have cached data, show the app immediately
      if (syncStatus?.hasData) {
        setInitialized(true)
        // Trigger background delta sync
        sync().catch(console.error)
        return
      }

      // No cached data - need to do initial sync
      try {
        await sync()
        setInitialized(true)
      } catch (err) {
        console.error('Initial sync failed:', err)
        // Still allow access with error state
        setInitialized(true)
      }
    }

    initialize()
  }, [checkingStatus, syncStatus, initialized, sync])

  // Show loading during initial check
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-400 dark:text-paper-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking local data...</span>
        </div>
      </div>
    )
  }

  // Show progress during initial sync (no cached data)
  if (!initialized && isSyncing) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
          <div className="text-center mb-6">
            <Loader2 className="w-12 h-12 animate-spin text-vermillion-500 mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100">
              Setting up WaniTrack
            </h2>
            <p className="text-sm text-ink-400 dark:text-paper-300 mt-2">
              Downloading your WaniKani data...
            </p>
          </div>

          {progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {progress.phase === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-patina-500" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-vermillion-500" />
                )}
                <span className="text-ink-100 dark:text-paper-100">{progress.message}</span>
              </div>

              <div className="h-2 bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vermillion-500 rounded-full transition-all duration-300"
                  style={{
                    width:
                      progress.phase === 'subjects'
                        ? '25%'
                        : progress.phase === 'assignments'
                          ? '50%'
                          : progress.phase === 'reviewStats'
                            ? '75%'
                            : progress.phase === 'levelProgressions'
                              ? '90%'
                              : progress.phase === 'complete'
                                ? '100%'
                                : '10%',
                  }}
                />
              </div>
            </div>
          )}

          {progress?.isFullSync && (
            <p className="text-xs text-ink-400 dark:text-paper-300 text-center mt-4">
              This only happens once. Future loads will be instant.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (!initialized && error) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md text-center">
          <AlertCircle className="w-12 h-12 text-vermillion-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
            Sync Failed
          </h2>
          <p className="text-sm text-ink-400 dark:text-paper-300 mb-6">{error}</p>
          <button
            onClick={() => sync()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

### 8.2 Create Sync Status Indicator

Create new file: `src/components/shared/sync-status.tsx`

```typescript
// src/components/shared/sync-status.tsx
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { cn } from '@/lib/utils/cn'

interface SyncStatusProps {
  className?: string
  showButton?: boolean
}

export function SyncStatus({ className, showButton = true }: SyncStatusProps) {
  const { sync, isSyncing, lastSyncAt, error } = useSync()

  return (
    <div className={cn('flex items-center gap-3 text-sm', className)}>
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-vermillion-500" />
          <span className="text-ink-400 dark:text-paper-300">Syncing...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-4 h-4 text-vermillion-500" />
          <span className="text-vermillion-500">Sync failed</span>
        </>
      ) : lastSyncAt ? (
        <>
          <CheckCircle className="w-4 h-4 text-patina-500" />
          <span className="text-ink-400 dark:text-paper-300">
            Synced {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
          </span>
        </>
      ) : (
        <span className="text-ink-400 dark:text-paper-300">Not synced</span>
      )}

      {showButton && !isSyncing && (
        <button
          onClick={() => sync()}
          className="p-1.5 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth"
          title="Sync now"
        >
          <RefreshCw className="w-4 h-4 text-ink-400 dark:text-paper-300" />
        </button>
      )}
    </div>
  )
}
```

### 8.3 Update `src/App.tsx`

Wrap the authenticated app content with the InitialSync component:

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserStore } from './stores/user-store'
import { AppShell } from './components/layout/app-shell'
import { ErrorBoundary } from './components/shared/error-boundary'
import { InitialSync } from './components/shared/initial-sync'
import { Loader2 } from 'lucide-react'

// ... lazy imports stay the same

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const token = useUserStore((state) => state.token)
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const isAuthenticated = !!token

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-400 dark:text-paper-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  const loadingFallback = (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center">
      <div className="flex items-center gap-3 text-ink-400 dark:text-paper-300">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <Suspense fallback={loadingFallback}>
        <Setup />
      </Suspense>
    )
  }

  // Wrap authenticated content with InitialSync
  return (
    <InitialSync>
      <AppShell>
        <Suspense fallback={loadingFallback}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/accuracy" element={<Accuracy />} />
            <Route path="/leeches" element={<Leeches />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </InitialSync>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
```

---

## Phase 9: Update Header to Show Sync Status

### 9.1 Update `src/components/layout/header.tsx`

Add sync status to the header:

```typescript
// In the header, add the SyncStatus component
import { SyncStatus } from '@/components/shared/sync-status'

// In the JSX, add before the theme toggle:
<SyncStatus className="hidden md:flex" showButton />
```

### 9.2 Update `src/components/layout/mobile-nav.tsx`

Add sync status to mobile nav:

```typescript
// In the mobile nav footer area, add:
import { SyncStatus } from '@/components/shared/sync-status'

// Add in the footer section:
<div className="px-5 py-3 border-t border-paper-300 dark:border-ink-300">
  <SyncStatus showButton />
</div>
```

---

## Phase 10: Update User Store for Clean Logout

### 10.1 Update `src/stores/user-store.ts`

Add database clearing on logout:

```typescript
// src/stores/user-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearDatabase } from '@/lib/db/database'
import type { User } from '@/lib/api/types'

interface UserState {
  token: string | null
  user: User | null
  _hasHydrated: boolean

  setToken: (token: string) => void
  setUser: (user: User) => void
  clearAuth: () => Promise<void> // Now async
  setHasHydrated: (state: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      setToken: (token: string) => set({ token }),
      setUser: (user: User) => set({ user }),
      
      clearAuth: async () => {
        // Clear IndexedDB when logging out
        try {
          await clearDatabase()
        } catch (err) {
          console.error('Failed to clear database:', err)
        }
        set({ token: null, user: null })
      },

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'wanikani-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
        }
      },
    }
  )
)
```

### 10.2 Update Logout Handlers

Update logout handlers in `header.tsx` and `mobile-nav.tsx` to await clearAuth:

```typescript
// In header.tsx
const handleLogout = async () => {
  if (confirm('Are you sure you want to disconnect? You\'ll need to re-enter your API token.')) {
    await clearAuth()
    setShowMenu(false)
  }
}

// In mobile-nav.tsx
onClick={async () => {
  if (confirm('Are you sure you want to disconnect? You\'ll need to re-enter your API token.')) {
    await clearAuth()
    onClose()
  }
}}
```

---

## Phase 11: Add Settings Page Sync Controls

### 11.1 Update `src/pages/settings.tsx`

Replace the placeholder settings with actual sync controls:

```typescript
// src/pages/settings.tsx
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Trash2, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { useSyncStatus } from '@/lib/api/queries'
import { useUserStore } from '@/stores/user-store'
import { useState } from 'react'

export function Settings() {
  const { sync, forceSync, isSyncing, lastSyncAt, lastSyncResult, error } = useSync()
  const { data: syncStatus } = useSyncStatus()
  const { clearAuth, user } = useUserStore()
  const [confirmingReset, setConfirmingReset] = useState(false)

  const handleForceSync = async () => {
    if (confirm('This will re-download all your data from WaniKani. Continue?')) {
      await forceSync()
    }
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to disconnect? This will clear all local data.')) {
      await clearAuth()
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100">
        Settings
      </h1>

      {/* Account Info */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-400 dark:text-paper-300">Username</span>
            <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
              {user?.username ?? 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-400 dark:text-paper-300">Level</span>
            <span className="text-sm font-medium text-ink-100 dark:text-paper-100">
              {user?.level ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Data Sync
        </h2>

        <div className="space-y-4">
          {/* Last Sync Info */}
          <div className="flex items-center gap-3">
            {error ? (
              <AlertCircle className="w-5 h-5 text-vermillion-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-patina-500" />
            )}
            <div>
              <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
                {error ? 'Last sync failed' : 'Data synced'}
              </div>
              {lastSyncAt && (
                <div className="text-xs text-ink-400 dark:text-paper-300">
                  {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
                </div>
              )}
            </div>
          </div>

          {/* Last Sync Results */}
          {lastSyncResult && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-paper-100 dark:bg-ink-100 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.subjects}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.assignments}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.reviewStatistics}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Review Stats</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-ink-100 dark:text-paper-100">
                  {lastSyncResult.levelProgressions}
                </div>
                <div className="text-xs text-ink-400 dark:text-paper-300">Level Progress</div>
              </div>
            </div>
          )}

          {/* Sync Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => sync()}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 rounded-md font-medium hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              Force Full Sync
            </button>
          </div>

          <p className="text-xs text-ink-400 dark:text-paper-300">
            Data is automatically synced in the background. Force full sync re-downloads everything.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-vermillion-500/30 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-vermillion-500 mb-4">
          Danger Zone
        </h2>
        <p className="text-sm text-ink-400 dark:text-paper-300 mb-4">
          Disconnecting will clear your API token and all locally cached data.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth"
        >
          <Trash2 className="w-4 h-4" />
          Disconnect & Clear Data
        </button>
      </div>
    </div>
  )
}
```

---

## Phase 12: File Structure Summary

After implementation, you should have these new files:

```
src/
├── lib/
│   ├── db/
│   │   ├── database.ts           # IndexedDB connection & operations
│   │   ├── schema.ts             # DB schema definitions
│   │   ├── sync-metadata.ts      # Sync timestamp management
│   │   └── repositories/
│   │       ├── index.ts
│   │       ├── subjects.ts
│   │       ├── assignments.ts
│   │       ├── review-statistics.ts
│   │       └── level-progressions.ts
│   └── sync/
│       └── sync-manager.ts       # Orchestrates sync operations
├── stores/
│   └── sync-store.ts             # Sync state management
├── hooks/
│   └── use-sync.ts               # Sync hook for components
└── components/
    └── shared/
        ├── initial-sync.tsx      # First-load sync UI
        └── sync-status.tsx       # Sync status indicator
```

---

## Phase 13: Testing Checklist

### 13.1 First-Time User Flow
- [ ] User enters API token
- [ ] Full sync begins with progress indicator
- [ ] All data types sync successfully
- [ ] Dashboard loads with data
- [ ] Subsequent page loads are instant

### 13.2 Returning User Flow
- [ ] App opens and displays cached data immediately
- [ ] Background delta sync runs
- [ ] UI updates if new data found
- [ ] Sync status shows in header

### 13.3 Sync Scenarios
- [ ] Delta sync after doing reviews (assignments/stats change)
- [ ] Delta sync after leveling up (new progressions)
- [ ] Force full sync clears and re-fetches
- [ ] Sync works while offline (shows cached data)

### 13.4 Edge Cases
- [ ] API token expired - handle gracefully
- [ ] Network error during sync - retry available
- [ ] Logout clears all local data
- [ ] Different users on same browser

### 13.5 Performance Metrics
- [ ] Initial sync: <60 seconds for high-level users
- [ ] Delta sync: <5 seconds typically
- [ ] Page load with cache: <200ms
- [ ] Memory usage stable after sync

---

## Implementation Order

Execute phases in this order:

1. **Phase 1** - Remove deprecated reviews endpoint
2. **Phase 2** - Set up IndexedDB infrastructure
3. **Phase 3** - Create repository layer
4. **Phase 4** - Update API layer for delta sync
5. **Phase 5** - Create sync manager
6. **Phase 6** - Create sync store and hook
7. **Phase 7** - Update query hooks
8. **Phase 8** - Update app initialization
9. **Phase 9** - Update header with sync status
10. **Phase 10** - Update user store for clean logout
11. **Phase 11** - Update settings page
12. **Phase 12** - Verify file structure
13. **Phase 13** - Run testing checklist

---

## Notes for Claude Code

- Keep all existing component logic intact - only data fetching changes
- Preserve the warm paper/ink theme and design system
- Use existing utilities like `cn()` for class merging
- Follow existing patterns for Zustand stores
- Keep error boundaries and offline indicator working
- The `/reviews` endpoint is **deprecated** - do not use it
- All API fetches must include `updated_after` parameter support
- Test with a fresh browser profile to verify first-time experience
