<!-- src/components/layout/AuthLayout.vue -->
<script setup lang="ts">
/**
 * AuthLayout - Layout для авторизованных пользователей
 *
 * Особенности:
 * - Автоматически редиректит неавторизованных на Keycloak
 * - Показывает полную навигацию
 * - Включает user menu в header
 * - Загружает данные текущего пользователя
 * - Поддержка модальных окон (boards, updates)
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import { useCurrentUser } from '@/composables/api/useUserProfile'

import AppLayout from './AppLayout.vue'
import UserMenu from '@/components/common/UserMenu.vue'
import BoardSelectorModal from '@/components/features/boards/BoardSelectorModal.vue'
import BoardCreateModal from '@/components/features/boards/BoardCreateModal.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

// ============ PROPS ============

export interface AuthLayoutProps {
  /** Показывать шапку */
  showHeader?: boolean
  /** Показывать поиск */
  showSearch?: boolean
  /** Редирект при отсутствии авторизации */
  redirectOnUnauth?: boolean
  /** Требуемые роли (опционально) */
  requiredRoles?: string[]
}

const props = withDefaults(defineProps<AuthLayoutProps>(), {
  showHeader: true,
  showSearch: true,
  redirectOnUnauth: true,
  requiredRoles: () => [],
})

// ============ EMITS ============

const emit = defineEmits<{
  (e: 'search', value: string): void
}>()

// ============ COMPOSABLES ============

const router = useRouter()
const route = useRoute()

// Auth state
const { isAuthenticated, isInitialized, isInitializing, login, logout: authLogout } = useAuth()

// User data
const {
  user,
  userId,
  username,
  avatarUrl: avatarBlobUrl,
  isLoading: isLoadingUser,
  load: loadCurrentUser,
} = useCurrentUser()

// ============ STATE ============

const showBoardSelector = ref(false)
const showBoardCreate = ref(false)
const showUpdatesPanel = ref(false)

// ============ COMPUTED ============

const isAuthLoading = computed(() => {
  return !isInitialized.value || isInitializing.value
})

const isReady = computed(() => {
  return isInitialized.value && isAuthenticated.value
})

/** Данные для UserMenu */
const userMenuData = computed(() => {
  // Приоритет: данные из user store, fallback на auth
  if (user.value) {
    return {
      id: user.value.id,
      username: user.value.username,
      email: user.value.email || '',
    }
  }

  // Fallback на данные из auth token
  return {
    id: userId.value || '',
    username: username.value || 'User',
    email: '',
  }
})

// ============ WATCHERS ============

// Редирект неавторизованных на Keycloak
watch(
  [isInitialized, isAuthenticated],
  ([initialized, authenticated]) => {
    if (initialized && !authenticated && props.redirectOnUnauth) {
      console.log('[AuthLayout] Not authenticated, redirecting to Keycloak')

      // Редирект на Keycloak с возвратом на текущий URL
      login({
        redirectUri: window.location.origin + route.fullPath,
      })
    }
  },
  { immediate: true },
)

// Загружаем данные пользователя при авторизации
watch(
  [isAuthenticated, user],
  async ([authenticated, currentUser]) => {
    if (authenticated && !currentUser && !isLoadingUser.value) {
      try {
        await loadCurrentUser()
      } catch (error) {
        console.warn('[AuthLayout] Failed to load user:', error)
      }
    }
  },
  { immediate: true },
)

// ============ METHODS ============

function handleSearch(value: string) {
  emit('search', value)
  router.push({ path: '/search', query: { q: value } })
}

function handleCreatePin() {
  router.push('/create')
}

function handleOpenUpdates() {
  showUpdatesPanel.value = true
}

function handleLogout() {
  authLogout()
}

function handleProfile() {
  const name = username.value || user.value?.username
  if (name) {
    router.push(`/user/${name}`)
  }
}

function handleSettings() {
  router.push('/settings')
}

function handleBoardCreated(boardId: string) {
  showBoardCreate.value = false
  router.push(`/board/${boardId}`)
}

// ============ LIFECYCLE ============

onMounted(async () => {
  // Загружаем пользователя если авторизован
  if (isAuthenticated.value && !user.value) {
    try {
      await loadCurrentUser()
    } catch (error) {
      console.warn('[AuthLayout] Failed to load user on mount:', error)
    }
  }
})
</script>

<template>
  <!-- Auth Loading State -->
  <div v-if="isAuthLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
    <BaseLoader variant="logo" size="lg" />
  </div>

  <!-- Not Authenticated - показываем пока идёт редирект -->
  <div
    v-else-if="!isAuthenticated"
    class="fixed inset-0 z-50 flex items-center justify-center bg-white"
  >
    <div class="text-center">
      <BaseLoader variant="spinner" size="md" />
      <p class="mt-4 text-gray-500">Redirecting to login...</p>
    </div>
  </div>

  <!-- Authenticated Layout -->
  <AppLayout
    v-else
    :show-header="showHeader"
    :show-search="showSearch"
    :show-navigation="true"
    :show-auth-loader="false"
    @search="handleSearch"
    @create-pin="handleCreatePin"
    @open-updates="handleOpenUpdates"
    @logout="handleLogout"
  >
    <!-- Header Right: User Menu -->
    <template #header-right>
      <div class="flex items-center gap-3">
        <!-- Board Selector Button -->
        <button
          @click="showBoardSelector = true"
          class="p-2 rounded-full hover:bg-gray-100 transition"
          title="Select Board"
        >
          <i class="pi pi-folder text-gray-600" />
        </button>

        <!-- Create Board Button -->
        <button
          @click="showBoardCreate = true"
          class="p-2 rounded-full hover:bg-gray-100 transition"
          title="Create Board"
        >
          <i class="pi pi-plus text-gray-600" />
        </button>

        <!-- User Menu -->
        <UserMenu
          :user="userMenuData"
          :user-image="avatarBlobUrl || undefined"
          @profile="handleProfile"
          @settings="handleSettings"
          @logout="handleLogout"
        />
      </div>
    </template>

    <!-- Main Content -->
    <slot />

    <!-- Modals -->
    <template #modals>
      <!-- Board Selector -->
      <BoardSelectorModal
        v-model="showBoardSelector"
        @select="showBoardSelector = false"
        @create="showBoardCreate = true"
      />

      <!-- Board Create -->
      <BoardCreateModal v-model="showBoardCreate" @created="handleBoardCreated" />

      <!-- Custom modals from parent -->
      <slot name="modals" />
    </template>

    <!-- Footer -->
    <template #footer>
      <slot name="footer" />
    </template>
  </AppLayout>
</template>
