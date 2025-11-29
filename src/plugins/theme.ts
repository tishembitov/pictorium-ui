// src/plugins/theme.ts
import type { App } from 'vue'
import { useUIStore } from '@/stores/ui.store'
import { STORAGE_KEYS } from '@/utils/constants'

export function setupTheme(app: App) {
  // Инициализация темы из localStorage или системных настроек
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | null

  let theme: 'light' | 'dark'

  if (savedTheme) {
    theme = savedTheme
  } else {
    // Определяем системную тему
    const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    theme = prefersDark ? 'dark' : 'light'
  }

  // Применяем тему
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEYS.THEME, theme)

  // Обновляем store
  const uiStore = useUIStore()
  uiStore.setTheme(theme)

  // Слушаем изменения системной темы
  const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
      const newTheme = e.matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      uiStore.setTheme(newTheme)
    }
  }

  mediaQuery.addEventListener('change', handleThemeChange)

  console.log('[Theme] Theme initialized:', theme)

  return {
    theme,
    cleanup: () => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    },
  }
}

/**
 * Переключение темы
 */
export function toggleTheme() {
  const uiStore = useUIStore()
  const currentTheme = uiStore.theme
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'

  document.documentElement.classList.toggle('dark', newTheme === 'dark')
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
  uiStore.setTheme(newTheme)

  console.log('[Theme] Theme toggled:', newTheme)
}
