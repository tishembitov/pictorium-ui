<!-- src/views/errors/NotFoundView.vue -->
<script setup lang="ts">
/**
 * NotFoundView - 404 page
 */

import { useRouter } from 'vue-router'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()

useDocumentTitle('Page Not Found')

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center max-w-md mx-auto p-8">
      <!-- Illustration -->
      <img
        src="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
        alt="Not found"
        class="w-64 h-64 mx-auto rounded-2xl object-cover mb-8"
      />

      <!-- Text -->
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
      <p class="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>

      <!-- Actions -->
      <div class="flex gap-4 justify-center">
        <BaseButton variant="ghost" @click="goBack"> Go Back </BaseButton>
        <BaseButton variant="primary" @click="goHome"> Go Home </BaseButton>
      </div>
    </div>
  </div>
</template>
