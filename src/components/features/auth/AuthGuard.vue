<!-- frontend/src/components/auth/AuthGuard.vue -->
<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex items-center justify-center min-h-[200px]">
    <slot name="loading">
      <div class="flex flex-col items-center gap-4">
        <div
          class="animate-spin h-8 w-8 border-4 border-pictorium-red border-t-transparent rounded-full"
        />
        <p class="text-gray-500">Проверка авторизации...</p>
      </div>
    </slot>
  </div>

  <!-- Not authenticated -->
  <div v-else-if="!isAuthenticated" class="flex items-center justify-center min-h-[200px]">
    <slot name="unauthorized">
      <div class="text-center max-w-md mx-auto p-8">
        <div
          class="w-16 h-16 mx-auto mb-6 bg-pictorium-red/10 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-pictorium-red"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 class="text-xl font-bold text-gray-900 mb-2">
          {{ title }}
        </h2>
        <p class="text-gray-600 mb-6">
          {{ description }}
        </p>

        <div class="space-y-3">
          <LoginButton class="w-full" :redirect-uri="currentUrl"> Войти </LoginButton>

          <SocialLoginButtons :redirect-uri="currentUrl" divider-text="или войдите через" />

          <p class="text-sm text-gray-500">
            Нет аккаунта?
            <button @click="register" class="text-pictorium-red hover:underline font-medium">
              Зарегистрируйтесь
            </button>
          </p>
        </div>
      </div>
    </slot>
  </div>

  <!-- Authenticated - render content -->
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/composables/auth/useAuth'
import LoginButton from './LoginButton.vue'
import SocialLoginButtons from './SocialLoginButtons.vue'

interface Props {
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Требуется авторизация',
  description: 'Войдите в аккаунт, чтобы получить доступ к этой странице',
})

const { isAuthenticated, isInitialized, isInitializing, register: authRegister } = useAuth()

const isLoading = computed(() => !isInitialized.value || isInitializing.value)
const currentUrl = computed(() => window.location.href)

function register() {
  authRegister({ redirectUri: currentUrl.value })
}
</script>
