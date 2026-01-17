// Settings Store - Manages user preferences
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SRSThreshold } from '@/data/jlpt'

interface SettingsState {
  // State
  theme: 'light' | 'dark'
  itemsPerPage: number
  autoRefreshEnabled: boolean
  autoRefreshInterval: number // seconds
  jlptThreshold: SRSThreshold // default: 'guru'
  showHiddenItems: boolean // default: false - show items removed from curriculum
  levelHistoryMode: 'bar-chart' | 'cards' | 'compact-list' // default: 'bar-chart'
  includeBurnedLeeches: boolean // default: false - exclude burned items from leeches
  forecastIncludeVocabulary: boolean // default: true - include vocabulary in level progression forecast
  showAllLevelsInAccuracy: boolean // default: false - show levels beyond user's current level in accuracy by level
  autoExcludeBreaks: boolean // default: true - automatically exclude outlier levels as breaks from averages

  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setItemsPerPage: (count: number) => void
  setAutoRefresh: (enabled: boolean, interval?: number) => void
  setJlptThreshold: (threshold: SRSThreshold) => void
  setShowHiddenItems: (value: boolean) => void
  setLevelHistoryMode: (mode: 'bar-chart' | 'cards' | 'compact-list') => void
  setIncludeBurnedLeeches: (value: boolean) => void
  setForecastIncludeVocabulary: (value: boolean) => void
  setShowAllLevelsInAccuracy: (value: boolean) => void
  setAutoExcludeBreaks: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      itemsPerPage: 50,
      autoRefreshEnabled: true,
      autoRefreshInterval: 30, // 30 seconds for summary data
      jlptThreshold: 'guru', // default to Guru (SRS 5+)
      showHiddenItems: false, // default to hiding curriculum-removed items
      levelHistoryMode: 'bar-chart', // default to bar chart view
      includeBurnedLeeches: false, // default to excluding burned items from leeches
      forecastIncludeVocabulary: true, // default to including vocabulary
      showAllLevelsInAccuracy: false, // default to hiding levels beyond current level
      autoExcludeBreaks: true, // default to auto-excluding outlier levels as breaks

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

      setJlptThreshold: (threshold: SRSThreshold) => {
        set({ jlptThreshold: threshold })
      },

      setShowHiddenItems: (value: boolean) => {
        set({ showHiddenItems: value })
      },

      setLevelHistoryMode: (mode: 'bar-chart' | 'cards' | 'compact-list') => {
        set({ levelHistoryMode: mode })
      },

      setIncludeBurnedLeeches: (value: boolean) => {
        set({ includeBurnedLeeches: value })
      },

      setForecastIncludeVocabulary: (value: boolean) => {
        set({ forecastIncludeVocabulary: value })
      },

      setShowAllLevelsInAccuracy: (value: boolean) => {
        set({ showAllLevelsInAccuracy: value })
      },

      setAutoExcludeBreaks: (value: boolean) => {
        set({ autoExcludeBreaks: value })
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
