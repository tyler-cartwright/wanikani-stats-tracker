/**
 * Export Store
 *
 * Zustand store for managing export preferences and state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExportOptions } from '@/lib/export/export-types'

interface ExportState {
  // Persisted preferences
  lastExportAt: string | null
  defaultOptions: ExportOptions

  // Transient state (not persisted)
  isExporting: boolean
  exportProgress: string | null
  exportError: string | null

  // Actions
  setDefaultOptions: (options: Partial<ExportOptions>) => void
  setExporting: (isExporting: boolean, progress?: string) => void
  setExportError: (error: string | null) => void
  recordExport: () => void
}

export const useExportStore = create<ExportState>()(
  persist(
    (set) => ({
      // Initial persisted state
      lastExportAt: null,
      defaultOptions: {
        includeSubjects: true,
        includeAssignments: true,
        includeReviewStats: true,
        includeLevelProgressions: true,
        includeActivityHistory: true, // IRREPLACEABLE captured history — always back up
        includeSyncMetadata: true,
        includeSettings: true,
        includeApiToken: false, // SENSITIVE - default false for security
      },

      // Initial transient state
      isExporting: false,
      exportProgress: null,
      exportError: null,

      // Actions
      setDefaultOptions: (options) =>
        set((state) => ({
          defaultOptions: { ...state.defaultOptions, ...options },
        })),

      setExporting: (isExporting, progress) =>
        set({
          isExporting,
          exportProgress: progress ?? null,
          exportError: null,
        }),

      setExportError: (error) =>
        set({
          exportError: error,
          isExporting: false,
          exportProgress: null,
        }),

      recordExport: () =>
        set({
          lastExportAt: new Date().toISOString(),
          isExporting: false,
          exportProgress: null,
          exportError: null,
        }),
    }),
    {
      name: 'wanikani-export', // LocalStorage key
      partialize: (state) => ({
        // Only persist these fields
        lastExportAt: state.lastExportAt,
        defaultOptions: state.defaultOptions,
      }),
      // Deep-merge defaultOptions so option keys added in later releases
      // (e.g. includeActivityHistory) get their defaults instead of being
      // dropped by a stale persisted object
      merge: (persisted, current) => {
        const stored = persisted as Partial<ExportState> | undefined
        return {
          ...current,
          ...stored,
          defaultOptions: {
            ...current.defaultOptions,
            ...stored?.defaultOptions,
          },
        }
      },
    }
  )
)
