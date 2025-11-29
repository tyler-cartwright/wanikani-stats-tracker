import { useSettingsStore } from '@/stores/settings-store'

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme)
  const toggleTheme = useSettingsStore((state) => state.toggleTheme)

  return { theme, toggleTheme }
}
