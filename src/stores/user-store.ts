// User Store - Manages API token and user data
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api/types'

interface UserState {
  // State
  token: string | null
  user: User | null
  _hasHydrated: boolean

  // Actions
  setToken: (token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setHasHydrated: (state: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      token: null,
      user: null,
      _hasHydrated: false,

      // Actions
      setToken: (token: string) =>
        set({
          token,
        }),

      setUser: (user: User) =>
        set({
          user,
        }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
        }),

      setHasHydrated: (state: boolean) =>
        set({
          _hasHydrated: state,
        }),
    }),
    {
      name: 'wanikani-auth', // localStorage key
      partialize: (state) => ({
        token: state.token,
        // Don't persist user data - it will be refetched on mount
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
        }
      },
    }
  )
)
