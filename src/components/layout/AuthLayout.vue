<!-- src/components/layout/AuthLayout.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import AppLayout from './AppLayout.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

const { isAuthenticated, isInitialized, login } = useAuth()

// Редирект неавторизованных
watch(
  [isInitialized, isAuthenticated],
  ([initialized, authenticated]) => {
    if (initialized && !authenticated) {
      login({ redirectUri: window.location.href })
    }
  },
  { immediate: true },
)

const isLoading = computed(() => !isInitialized.value)
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white">
    <BaseLoader variant="spinner" size="lg" />
  </div>

  <!-- Content -->
  <AppLayout v-else-if="isAuthenticated">
    <!-- ✅ RouterView для дочерних роутов -->
    <template #default>
      <RouterView />
    </template>
  </AppLayout>

  <!-- Redirecting state -->
  <div v-else class="fixed inset-0 flex items-center justify-center bg-white">
    <p class="text-gray-500">Redirecting to login...</p>
  </div>
</template>
