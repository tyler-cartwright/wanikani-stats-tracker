// src/lib/db/migrations.ts
//
// IndexedDB schema migrations, keyed by the DB version they migrate TO.
// runMigrations applies every step from oldVersion+1 through newVersion
// inside the upgrade transaction, so a user can jump multiple versions in
// one open (e.g. a long-dormant install going 1 -> 4).
//
// Rules for writing a migration:
// - Never delete or clear an existing store: user data must survive every
//   app update. Delta sync handles data freshness, not migrations.
// - Schema-only steps use `db`; steps that rewrite records use `tx` to
//   access existing stores within the same upgrade transaction.
import { STORES } from './schema'

type Migration = (db: IDBDatabase, tx: IDBTransaction) => void

const migrations: Record<number, Migration> = {
  // v1: initial schema (synced collections + sync metadata)
  1: (db) => {
    db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'id' })

    const subjects = db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' })
    subjects.createIndex('updatedAt', 'updatedAt', { unique: false })

    const assignments = db.createObjectStore(STORES.ASSIGNMENTS, { keyPath: 'id' })
    assignments.createIndex('subjectId', 'subjectId', { unique: false })
    assignments.createIndex('updatedAt', 'updatedAt', { unique: false })

    const reviewStatistics = db.createObjectStore(STORES.REVIEW_STATISTICS, {
      keyPath: 'id',
    })
    reviewStatistics.createIndex('subjectId', 'subjectId', { unique: false })
    reviewStatistics.createIndex('updatedAt', 'updatedAt', { unique: false })

    const levelProgressions = db.createObjectStore(STORES.LEVEL_PROGRESSIONS, {
      keyPath: 'id',
    })
    levelProgressions.createIndex('level', 'level', { unique: false })
    levelProgressions.createIndex('updatedAt', 'updatedAt', { unique: false })
  },

  // v2: last-known /user and /resets responses for offline fallbacks
  2: (db) => {
    db.createObjectStore(STORES.API_SNAPSHOTS, { keyPath: 'endpoint' })
  },
}

export function runMigrations(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number,
  tx: IDBTransaction
): void {
  for (let version = oldVersion + 1; version <= newVersion; version++) {
    const migrate = migrations[version]
    if (!migrate) {
      throw new Error(`No migration defined for DB version ${version}`)
    }
    console.log(`[DB] Running migration to version ${version}`)
    migrate(db, tx)
  }
}
