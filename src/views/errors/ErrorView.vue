<!-- src/views/errors/ErrorView.vue -->
<script setup lang="ts">
/**
 * ErrorView - Generic error page
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import BaseButton from '@/components/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()

const errorCode = computed(() => route.query.code || '500')
const errorMessage = computed(() => {
  const msg = route.query.message
  return typeof msg === 'string' ? msg : 'Something went wrong'
})

useDocumentTitle(`Error ${errorCode.value}`)

function goHome() {
  router.push('/')
}

function retry() {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center max-w-md mx-auto p-8">
      <!-- Icon -->
      <div class="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500" />
      </div>

      <!-- Text -->
      <h1 class="text-4xl font-bold text-gray-900 mb-2">Error {{ errorCode }}</h1>
      <p class="text-gray-500 mb-8">{{ errorMessage }}</p>

      <!-- Actions -->
      <div class="flex gap-4 justify-center">
        <BaseButton variant="ghost" @click="retry"> Try Again </BaseButton>
        <BaseButton variant="primary" @click="goHome"> Go Home </BaseButton>
      </div>
    </div>
  </div>
</template>
