<!-- src/views/auth/LoginView.vue -->
<script setup lang="ts">
/**
 * LoginView - Страница входа
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import LoginButton from '@/components/features/auth/LoginButton.vue'
import SocialLoginButtons from '@/components/features/auth/SocialLoginButtons.vue'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, isInitialized } = useAuth()

useDocumentTitle('Sign In')

// Redirect URL
const redirectUri = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' ? redirect : '/'
})

// Redirect if already authenticated
if (isInitialized.value && isAuthenticated.value) {
  router.replace(redirectUri.value)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-pictorium-red">Pictorium</h1>
        <p class="text-gray-600 mt-2">Discover and save creative ideas</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-center mb-6">Welcome back</h2>

        <!-- Social Login -->
        <SocialLoginButtons :redirect-uri="redirectUri" divider-text="or continue with email" />

        <!-- Email Login -->
        <div class="mt-6">
          <LoginButton class="w-full" :redirect-uri="redirectUri">
            Continue with Email
          </LoginButton>
        </div>

        <!-- Register Link -->
        <p class="text-center text-sm text-gray-500 mt-6">
          Don't have an account?
          <router-link
            :to="{ path: '/register', query: { redirect: redirectUri } }"
            class="text-pictorium-red hover:underline font-medium"
          >
            Sign up
          </router-link>
        </p>
      </div>

      <!-- Terms -->
      <p class="text-center text-xs text-gray-400 mt-6">
        By continuing, you agree to our
        <a href="#" class="underline">Terms of Service</a>
        and
        <a href="#" class="underline">Privacy Policy</a>
      </p>
    </div>
  </div>
</template>
