// Settings Store - Manages user preferences
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // State
  theme: 'light' | 'dark'
  itemsPerPage: number
  autoRefreshEnabled: boolean
  autoRefreshInterval: number // seconds

  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setItemsPerPage: (count: number) => void
  setAutoRefresh: (enabled: boolean, interval?: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      itemsPerPage: 50,
      autoRefreshEnabled: true,
      autoRefreshInterval: 30, // 30 seconds for summary data

      // Actions
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme })
        // Update DOM class for Tailwind dark mode
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },

      setItemsPerPage: (count: number) => {
        set({ itemsPerPage: count })
      },

      setAutoRefresh: (enabled: boolean, interval?: number) => {
        set({
          autoRefreshEnabled: enabled,
          ...(interval !== undefined && { autoRefreshInterval: interval }),
        })
      },
    }),
    {
      name: 'wanikani-settings', // localStorage key
    }
  )
)

// Initialize theme on load
const theme = useSettingsStore.getState().theme
if (theme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
