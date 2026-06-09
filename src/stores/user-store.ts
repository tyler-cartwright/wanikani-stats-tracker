// User Store - Manages API token only
// User data is now fetched fresh via React Query to avoid stale cache
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearDatabase } from '@/lib/db/database'
import { queryClient } from '@/lib/query-client'

interface UserState {
  // State
  token: string | null
  _hasHydrated: boolean

  // Actions
  setToken: (token: string) => void
  clearAuth: () => Promise<void>
  setHasHydrated: (state: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      token: null,
      _hasHydrated: false,

      // Actions
      setToken: (token: string) =>
        set({
          token,
        }),

      clearAuth: async () => {
        // Clear account data on logout: IndexedDB and the in-memory query
        // cache (so a different account's token can't see stale data).
        // Never touch Cache Storage — the service worker owns app assets.
        try {
          await clearDatabase()
        } catch (err) {
          console.error('Failed to clear database:', err)
        }
        queryClient.clear()
        set({ token: null })
      },

      setHasHydrated: (state: boolean) =>
        set({
          _hasHydrated: state,
        }),
    }),
    {
      name: 'wanikani-auth', // localStorage key
      partialize: (state) => ({
        token: state.token,
        // Only persist token, not user data
        // User data is fetched fresh via React Query
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
        }
      },
    }
  )
)
