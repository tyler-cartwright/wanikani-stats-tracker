// src/lib/db/repositories/api-snapshots.ts
//
// Last-known responses for /user and /resets. These endpoints aren't
// delta-synced collections, so each is stored as a single replace-on-write
// record and used as an offline fallback when the live fetch fails.
import { getById, putOne } from '../database'
import { STORES, type ApiSnapshot } from '../schema'
import type { Reset, User } from '@/lib/api/types'

async function getSnapshot<T>(endpoint: ApiSnapshot['endpoint']): Promise<T | undefined> {
  const snapshot = await getById<ApiSnapshot<T>>(STORES.API_SNAPSHOTS, endpoint)
  return snapshot?.data
}

async function saveSnapshot<T>(endpoint: ApiSnapshot['endpoint'], data: T): Promise<void> {
  const snapshot: ApiSnapshot<T> = {
    endpoint,
    data,
    updatedAt: new Date().toISOString(),
  }
  await putOne(STORES.API_SNAPSHOTS, snapshot)
}

export async function getUserSnapshot(): Promise<User | undefined> {
  return getSnapshot<User>('user')
}

export async function saveUserSnapshot(user: User): Promise<void> {
  return saveSnapshot('user', user)
}

export async function getResetsSnapshot(): Promise<(Reset & { id: number })[] | undefined> {
  return getSnapshot<(Reset & { id: number })[]>('resets')
}

export async function saveResetsSnapshot(resets: (Reset & { id: number })[]): Promise<void> {
  return saveSnapshot('resets', resets)
}
