// src/stores/ui.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'

interface Modal {
  id: string
  component?: unknown
  props?: Record<string, unknown>
  isOpen: boolean
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

export const useUIStore = defineStore('ui', () => {
  // ============ STATE ============

  // Modals - используем reactive для Map
  const modals = reactive(new Map<string, Modal>())

  // Toasts
  const toasts = ref<Toast[]>([])

  // Loading
  const globalLoading = ref(false)
  const loadingMessage = ref('')
  const loadingOperations = reactive(new Set<string>())

  // Sidebar
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(280)

  // Theme (управляется через plugin, здесь только state)
  const theme = ref<'light' | 'dark'>('light')

  // Scroll positions (для KeepAlive)
  const scrollPositions = reactive(new Map<string, number>())

  // Mobile
  const isMobileMenuOpen = ref(false)

  // Image viewer
  const imageViewerUrl = ref<string | null>(null)

  // ============ GETTERS ============

  const isAnyModalOpen = computed(() => {
    return Array.from(modals.values()).some((m) => m.isOpen)
  })

  const getModalById = computed(() => (id: string) => {
    return modals.get(id)
  })

  const isLoading = computed(() => {
    return globalLoading.value || loadingOperations.size > 0
  })

  // ============ ACTIONS - MODALS ============

  function openModal(id: string, component?: unknown, props?: Record<string, unknown>) {
    modals.set(id, { id, component, props, isOpen: true })
    document.body.style.overflow = 'hidden'
  }

  function closeModal(id: string) {
    const modal = modals.get(id)
    if (modal) {
      modal.isOpen = false
    }

    if (!isAnyModalOpen.value) {
      document.body.style.overflow = ''
    }
  }

  function closeAllModals() {
    modals.forEach((modal) => {
      modal.isOpen = false
    })
    document.body.style.overflow = ''
  }

  function toggleModal(id: string) {
    const modal = modals.get(id)
    if (modal?.isOpen) {
      closeModal(id)
    } else {
      openModal(id)
    }
  }

  // ============ ACTIONS - LOADING ============

  function showLoading(message = 'Loading...') {
    globalLoading.value = true
    loadingMessage.value = message
  }

  function hideLoading() {
    globalLoading.value = false
    loadingMessage.value = ''
  }

  function startOperation(operationId: string) {
    loadingOperations.add(operationId)
  }

  function endOperation(operationId: string) {
    loadingOperations.delete(operationId)
  }

  // ============ ACTIONS - TOASTS ============

  function addToast(message: string, type: Toast['type'] = 'info', duration = 3000): string {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts.value.push({ id, message, type, duration })

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }

    return id
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function clearToasts() {
    toasts.value = []
  }

  // ============ ACTIONS - SIDEBAR ============

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // Сохраняем в localStorage
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  function setSidebarWidth(width: number) {
    sidebarWidth.value = Math.max(80, Math.min(800, width))
    localStorage.setItem('sidebarWidth', String(sidebarWidth.value))
  }

  function openSidebar() {
    sidebarCollapsed.value = false
    localStorage.setItem('sidebarCollapsed', 'false')
  }

  function closeSidebar() {
    sidebarCollapsed.value = true
    localStorage.setItem('sidebarCollapsed', 'true')
  }

  function restoreSidebarState() {
    const collapsed = localStorage.getItem('sidebarCollapsed')
    if (collapsed !== null) {
      sidebarCollapsed.value = collapsed === 'true'
    }

    const width = localStorage.getItem('sidebarWidth')
    if (width) {
      sidebarWidth.value = parseInt(width, 10)
    }
  }

  // ============ ACTIONS - THEME ============
  // Логика инициализации перенесена в plugin/theme.ts
  // Здесь только сеттер

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
  }

  // ============ ACTIONS - SCROLL ============

  function saveScrollPosition(key: string, position: number) {
    scrollPositions.set(key, position)
  }

  function getScrollPosition(key: string): number {
    return scrollPositions.get(key) || 0
  }

  function clearScrollPosition(key: string) {
    scrollPositions.delete(key)
  }

  function clearAllScrollPositions() {
    scrollPositions.clear()
  }

  // ============ ACTIONS - MOBILE ============

  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  // ============ ACTIONS - IMAGE VIEWER ============

  function openImageViewer(url: string) {
    imageViewerUrl.value = url
    document.body.style.overflow = 'hidden'
  }

  function closeImageViewer() {
    imageViewerUrl.value = null
    document.body.style.overflow = ''
  }

  return {
    // State
    modals,
    toasts,
    globalLoading,
    loadingMessage,
    loadingOperations,
    sidebarCollapsed,
    sidebarWidth,
    theme,
    scrollPositions,
    isMobileMenuOpen,
    imageViewerUrl,

    // Getters
    isAnyModalOpen,
    getModalById,
    isLoading,

    // Actions - Modals
    openModal,
    closeModal,
    closeAllModals,
    toggleModal,

    // Actions - Loading
    showLoading,
    hideLoading,
    startOperation,
    endOperation,

    // Actions - Toasts
    addToast,
    removeToast,
    clearToasts,

    // Actions - Sidebar
    toggleSidebar,
    setSidebarWidth,
    openSidebar,
    closeSidebar,
    restoreSidebarState,

    // Actions - Theme
    setTheme,

    // Actions - Scroll
    saveScrollPosition,
    getScrollPosition,
    clearScrollPosition,
    clearAllScrollPositions,

    // Actions - Mobile
    toggleMobileMenu,
    closeMobileMenu,

    // Actions - Image Viewer
    openImageViewer,
    closeImageViewer,
  }
})
