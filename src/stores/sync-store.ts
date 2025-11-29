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
