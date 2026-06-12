// src/lib/db/repositories/trainer-sessions.ts
//
// Self-study trainer session results. Local-only: the WaniKani API never
// sees these, so they can't be re-downloaded — force-sync preserves the
// store and only a full logout clears it.
import { count, getAll, putOne } from '../database'
import { STORES, type TrainerSessionRow } from '../schema'

export async function getTrainerSessions(): Promise<TrainerSessionRow[]> {
  const sessions = await getAll<TrainerSessionRow>(STORES.TRAINER_SESSIONS)
  return sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
}

export async function putTrainerSession(row: TrainerSessionRow): Promise<void> {
  return putOne(STORES.TRAINER_SESSIONS, row)
}

export async function getTrainerSessionCount(): Promise<number> {
  return count(STORES.TRAINER_SESSIONS)
}
