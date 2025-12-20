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
  useActiveAverage: boolean // default: true
  averagingMethod: 'trimmed_mean' | 'median' // default: 'trimmed_mean'
  useCustomThreshold: boolean // default: false
  customThresholdDays: number // default: 60
  jlptThreshold: SRSThreshold // default: 'guru'
  showHiddenItems: boolean // default: false - show items removed from curriculum
  levelHistoryMode: 'bar-chart' | 'cards' | 'compact-list' // default: 'bar-chart'
  includeBurnedLeeches: boolean // default: false - exclude burned items from leeches

  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setItemsPerPage: (count: number) => void
  setAutoRefresh: (enabled: boolean, interval?: number) => void
  setUseActiveAverage: (value: boolean) => void
  setAveragingMethod: (method: 'trimmed_mean' | 'median') => void
  setUseCustomThreshold: (value: boolean) => void
  setCustomThresholdDays: (days: number) => void
  setJlptThreshold: (threshold: SRSThreshold) => void
  setShowHiddenItems: (value: boolean) => void
  setLevelHistoryMode: (mode: 'bar-chart' | 'cards' | 'compact-list') => void
  setIncludeBurnedLeeches: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      itemsPerPage: 50,
      autoRefreshEnabled: true,
      autoRefreshInterval: 30, // 30 seconds for summary data
      useActiveAverage: true, // default to active average
      averagingMethod: 'trimmed_mean', // default to trimmed mean
      useCustomThreshold: false, // default to OFF
      customThresholdDays: 60, // default 60 days
      jlptThreshold: 'guru', // default to Guru (SRS 5+)
      showHiddenItems: false, // default to hiding curriculum-removed items
      levelHistoryMode: 'bar-chart', // default to bar chart view
      includeBurnedLeeches: false, // default to excluding burned items from leeches

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

      setUseActiveAverage: (value: boolean) => {
        set({ useActiveAverage: value })
      },

      setAveragingMethod: (method: 'trimmed_mean' | 'median') => {
        set({ averagingMethod: method })
      },

      setUseCustomThreshold: (value: boolean) => {
        set({ useCustomThreshold: value })
      },

      setCustomThresholdDays: (days: number) => {
        set({ customThresholdDays: Math.max(1, Math.min(365, days)) }) // Clamp between 1-365 days
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
