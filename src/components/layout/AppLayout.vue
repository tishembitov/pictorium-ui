<!-- src/components/layout/AppLayout.vue -->
<script setup lang="ts">
/**
 * AppLayout - Основной layout приложения
 *
 * Включает:
 * - Navigation (боковая панель) - для авторизованных
 * - AppHeader (шапка) - опционально
 * - ScrollToTop
 * - Слоты для модальных окон
 */

import { ref, computed, provide, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import { useCurrentUser } from '@/composables/api/useUserProfile'

import Navigation from '@/components/common/Navigation.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

// ============ PROPS ============

export interface AppLayoutProps {
  /** Показывать шапку */
  showHeader?: boolean
  /** Показывать поиск в шапке */
  showSearch?: boolean
  /** Показывать навигацию */
  showNavigation?: boolean
  /** Показывать кнопку ScrollToTop */
  showScrollTop?: boolean
  /** Полноэкранный режим (без отступов) */
  fullscreen?: boolean
  /** Показывать загрузку при инициализации auth */
  showAuthLoader?: boolean
}

const props = withDefaults(defineProps<AppLayoutProps>(), {
  showHeader: true,
  showSearch: true,
  showNavigation: true,
  showScrollTop: true,
  fullscreen: false,
  showAuthLoader: true,
})

// ============ EMITS ============

const emit = defineEmits<{
  (e: 'search', value: string): void
  (e: 'createPin'): void
  (e: 'openUpdates'): void
  (e: 'logout'): void
}>()

// ============ COMPOSABLES ============

const router = useRouter()

// Auth state (из Keycloak)
const { isAuthenticated, isInitialized, isInitializing, logout: authLogout } = useAuth()

// User data (из store/API)
const {
  user,
  userId,
  username,
  avatarUrl: avatarBlobUrl,
  isLoading: isLoadingUser,
  load: loadCurrentUser,
} = useCurrentUser()

// ============ STATE ============

const unreadMessages = ref(0)
const unreadUpdates = ref(0)

// ============ COMPUTED ============

const isLoading = computed(() => {
  if (!props.showAuthLoader) return false
  return !isInitialized.value || isInitializing.value
})

const showNav = computed(() => {
  return props.showNavigation && isAuthenticated.value
})

/** Данные пользователя для Navigation */
const navigationUser = computed(() => {
  if (!user.value) {
    // Fallback на данные из auth если user ещё не загружен
    if (userId.value && username.value) {
      return {
        id: userId.value,
        username: username.value,
        imageUrl: undefined,
      }
    }
    return undefined
  }

  return {
    id: user.value.id,
    username: user.value.username,
    imageUrl: user.value.imageUrl,
  }
})

const contentClasses = computed(() => {
  const classes: string[] = []

  if (showNav.value) {
    classes.push('ml-20') // Отступ для Navigation
  }

  if (props.showHeader) {
    classes.push('mt-16') // Отступ для Header
  }

  if (!props.fullscreen) {
    classes.push('min-h-screen')
  }

  return classes
})

// ============ METHODS ============

function handleSearch(value: string) {
  emit('search', value)
}

function handleCreatePin() {
  emit('createPin')
  router.push('/create')
}

function handleOpenUpdates() {
  emit('openUpdates')
}

function handleLogout() {
  emit('logout')
  authLogout()
}

// ============ LIFECYCLE ============

onMounted(async () => {
  // Загружаем данные текущего пользователя если авторизован
  if (isAuthenticated.value && !user.value) {
    try {
      await loadCurrentUser()
    } catch (error) {
      console.warn('[AppLayout] Failed to load current user:', error)
    }
  }
})

// ============ PROVIDE ============

provide('layout', {
  isAuthenticated,
  userId,
  username,
  showNavigation: showNav,
})
</script>

<template>
  <!-- Auth Loading -->
  <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
    <div class="flex flex-col items-center gap-4">
      <BaseLoader variant="logo" size="lg" />
      <p class="text-gray-500 animate-pulse">Loading...</p>
    </div>
  </div>

  <!-- Main Layout -->
  <div v-else class="relative">
    <!-- Navigation (Aside) -->
    <Navigation
      v-if="showNav"
      :user="navigationUser"
      :user-image="avatarBlobUrl || undefined"
      :unread-messages="unreadMessages"
      :unread-updates="unreadUpdates"
      @logout="handleLogout"
      @create-pin="handleCreatePin"
      @open-updates="handleOpenUpdates"
    />

    <!-- Header -->
    <AppHeader v-if="showHeader" :show-search="showSearch" @search="handleSearch">
      <template #right>
        <slot name="header-right" />
      </template>

      <template #searchSection="{ searchValue }">
        <slot name="search-section" :search-value="searchValue" />
      </template>
    </AppHeader>

    <!-- Main Content -->
    <main :class="contentClasses">
      <slot />
    </main>

    <!-- Modals Slot -->
    <slot name="modals" />

    <!-- ScrollToTop -->
    <ScrollToTop v-if="showScrollTop" />

    <!-- Footer Slot -->
    <slot name="footer" />
  </div>
</template>
