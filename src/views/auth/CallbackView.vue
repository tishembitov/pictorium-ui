<!-- src/views/auth/CallbackView.vue -->
<script setup lang="ts">
/**
 * CallbackView - OAuth callback handler
 */

import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import BaseLoader from '@/components/ui/BaseLoader.vue'

const router = useRouter()
const { handleCallback, getReturnUrl } = useAuth()

const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await handleCallback()

    // Redirect to saved URL or home
    const returnUrl = getReturnUrl() || '/'
    router.replace(returnUrl)
  } catch (e) {
    error.value = 'Authentication failed. Please try again.'

    // Redirect to login after delay
    setTimeout(() => {
      router.replace('/login')
    }, 3000)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <template v-if="!error">
        <BaseLoader variant="colorful" size="lg" />
        <p class="mt-4 text-gray-600">Completing sign in...</p>
      </template>

      <template v-else>
        <div class="text-red-500 mb-4">
          <i class="pi pi-exclamation-circle text-4xl" />
        </div>
        <p class="text-red-600">{{ error }}</p>
        <p class="text-gray-500 text-sm mt-2">Redirecting to login...</p>
      </template>
    </div>
  </div>
</template>
