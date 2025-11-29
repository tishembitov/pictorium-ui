<!-- src/views/auth/RegisterView.vue -->
<script setup lang="ts">
/**
 * RegisterView - Страница регистрации
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import SocialLoginButtons from '@/components/features/auth/SocialLoginButtons.vue'

const route = useRoute()
const router = useRouter()
const { register, isAuthenticated, isInitialized } = useAuth()

useDocumentTitle('Sign Up')

const redirectUri = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' ? redirect : '/'
})

// Redirect if already authenticated
if (isInitialized.value && isAuthenticated.value) {
  router.replace(redirectUri.value)
}

function handleRegister() {
  register({ redirectUri: redirectUri.value })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-pictorium-red">Pictorium</h1>
        <p class="text-gray-600 mt-2">Join millions of creatives</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-center mb-6">Create account</h2>

        <!-- Social Registration -->
        <SocialLoginButtons :redirect-uri="redirectUri" divider-text="or sign up with email" />

        <!-- Email Registration -->
        <div class="mt-6">
          <button
            @click="handleRegister"
            class="w-full px-6 py-3 bg-pictorium-red text-white rounded-full font-semibold hover:bg-pictorium-red-hover transition"
          >
            Sign up with Email
          </button>
        </div>

        <!-- Login Link -->
        <p class="text-center text-sm text-gray-500 mt-6">
          Already have an account?
          <router-link
            :to="{ path: '/login', query: { redirect: redirectUri } }"
            class="text-pictorium-red hover:underline font-medium"
          >
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
