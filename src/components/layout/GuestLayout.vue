<!-- src/components/layout/GuestLayout.vue -->
<script setup lang="ts">
/**
 * GuestLayout - Layout для неавторизованных пользователей
 *
 * Особенности:
 * - Упрощённая навигация (без боковой панели)
 * - Кнопки входа/регистрации в header
 * - Минимальный header без Navigation
 */

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'

import ScrollToTop from '@/components/common/ScrollToTop.vue'
import LoginButton from '@/components/features/auth/LoginButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

// ============ PROPS ============

export interface GuestLayoutProps {
  /** Показывать шапку */
  showHeader?: boolean
  /** Показывать логотип */
  showLogo?: boolean
  /** Показывать кнопки авторизации */
  showAuthButtons?: boolean
  /** Центрировать контент */
  centered?: boolean
  /** Вариант кнопок авторизации */
  authButtonsVariant?: 'full' | 'compact' | 'minimal'
}

const props = withDefaults(defineProps<GuestLayoutProps>(), {
  showHeader: true,
  showLogo: true,
  showAuthButtons: true,
  centered: false,
  authButtonsVariant: 'compact',
})

// ============ COMPOSABLES ============

const router = useRouter()
const { isAuthenticated, isInitialized, isInitializing } = useAuth()

// ============ COMPUTED ============

const isLoading = computed(() => {
  return !isInitialized.value || isInitializing.value
})

const contentClasses = computed(() => {
  const classes = ['min-h-screen']
  if (props.showHeader) classes.push('pt-16')
  if (props.centered) classes.push('flex items-center justify-center')
  return classes
})

// ============ METHODS ============

function goHome() {
  router.push('/')
}
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
    <BaseLoader variant="logo" size="lg" />
  </div>

  <!-- Guest Layout -->
  <div v-else class="relative">
    <!-- Simple Header -->
    <header
      v-if="showHeader"
      class="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100"
    >
      <div class="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        <!-- Logo -->
        <button
          v-if="showLogo"
          @click="goHome"
          class="flex items-center gap-3 hover:opacity-80 transition"
        >
          <span class="text-3xl">🐰</span>
          <span class="text-xl font-bold text-gray-900 hidden sm:block"> Pictorium </span>
        </button>

        <!-- Auth Buttons (только для неавторизованных) -->
        <div v-if="showAuthButtons && !isAuthenticated" class="flex items-center gap-3">
          <!-- Minimal -->
          <template v-if="authButtonsVariant === 'minimal'">
            <LoginButton variant="primary" size="sm"> Log in </LoginButton>
          </template>

          <!-- Compact -->
          <template v-else-if="authButtonsVariant === 'compact'">
            <LoginButton variant="ghost" size="sm"> Log in </LoginButton>
            <LoginButton variant="primary" size="sm"> Sign up </LoginButton>
          </template>

          <!-- Full -->
          <template v-else>
            <LoginButton variant="outline" size="sm"> Log in </LoginButton>
            <LoginButton variant="primary" size="sm" provider="google">
              <template #icon>
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                </svg>
              </template>
              Google
            </LoginButton>
          </template>
        </div>

        <!-- Authenticated: Go to app button -->
        <div v-else-if="isAuthenticated" class="flex items-center gap-3">
          <button
            @click="goHome"
            class="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-medium"
          >
            Open App
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main :class="contentClasses">
      <slot />
    </main>

    <ScrollToTop />

    <slot name="footer" />
    <slot name="modals" />
  </div>
</template>
