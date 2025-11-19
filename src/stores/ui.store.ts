// src/stores/ui.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Modal {
  id: string
  component?: unknown
  props?: Record<string, unknown>
  isOpen: boolean
}

export const useUIStore = defineStore('ui', () => {
  // ============ STATE ============

  // Modals
  const modals = ref<Map<string, Modal>>(new Map())

  // Loading states
  const globalLoading = ref(false)
  const loadingMessage = ref('')

  // Toasts (если не используем vue-toastification)
  const toasts = ref<
    Array<{
      id: string
      message: string
      type: 'success' | 'error' | 'warning' | 'info'
      duration: number
    }>
  >([])

  // Sidebar
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(280) // для chats

  // Theme
  const theme = ref<'light' | 'dark'>('light')

  // Scroll position (для KeepAlive)
  const scrollPositions = ref<Map<string, number>>(new Map())

  // ============ GETTERS ============

  const isAnyModalOpen = computed(() => {
    return Array.from(modals.value.values()).some((m) => m.isOpen)
  })

  const getModalById = computed(() => (id: string) => {
    return modals.value.get(id)
  })

  // ============ ACTIONS ============

  /**
   * Открыть модалку
   */
  function openModal(id: string, component?: unknown, props?: Record<string, unknown>) {
    modals.value.set(id, {
      id,
      component,
      props,
      isOpen: true,
    })

    // Блокируем скролл body
    document.body.style.overflow = 'hidden'
  }

  /**
   * Закрыть модалку
   */
  function closeModal(id: string) {
    const modal = modals.value.get(id)
    if (modal) {
      modal.isOpen = false
    }

    // Разблокируем скролл если все модалки закрыты
    if (!isAnyModalOpen.value) {
      document.body.style.overflow = ''
    }
  }

  /**
   * Закрыть все модалки
   */
  function closeAllModals() {
    modals.value.forEach((modal) => {
      modal.isOpen = false
    })
    document.body.style.overflow = ''
  }

  /**
   * Toggle модалки
   */
  function toggleModal(id: string) {
    const modal = modals.value.get(id)
    if (modal?.isOpen) {
      closeModal(id)
    } else {
      openModal(id)
    }
  }

  /**
   * Глобальная загрузка
   */
  function showLoading(message = 'Loading...') {
    globalLoading.value = true
    loadingMessage.value = message
  }

  function hideLoading() {
    globalLoading.value = false
    loadingMessage.value = ''
  }

  /**
   * Sidebar
   */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarWidth(width: number) {
    sidebarWidth.value = Math.max(80, Math.min(800, width))
  }

  /**
   * Theme
   */
  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  /**
   * Scroll positions (для восстановления при KeepAlive)
   */
  function saveScrollPosition(key: string, position: number) {
    scrollPositions.value.set(key, position)
  }

  function getScrollPosition(key: string): number {
    return scrollPositions.value.get(key) || 0
  }

  function clearScrollPosition(key: string) {
    scrollPositions.value.delete(key)
  }

  return {
    // State
    modals,
    globalLoading,
    loadingMessage,
    toasts,
    sidebarCollapsed,
    sidebarWidth,
    theme,
    scrollPositions,

    // Getters
    isAnyModalOpen,
    getModalById,

    // Actions
    openModal,
    closeModal,
    closeAllModals,
    toggleModal,
    showLoading,
    hideLoading,
    toggleSidebar,
    setSidebarWidth,
    setTheme,
    toggleTheme,
    saveScrollPosition,
    getScrollPosition,
    clearScrollPosition,
  }
})
