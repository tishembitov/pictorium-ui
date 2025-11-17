<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from './AppLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import LoadingScreen from '@/components/common/LoadingScreen.vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  // Проверяем авторизацию
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth()

    if (!authStore.isAuthenticated) {
      router.push('/landing')
    }
  }
})
</script>

<template>
  <LoadingScreen v-if="authStore.loading" message="Loading..." />

  <AppLayout v-else>
    <slot />
  </AppLayout>
</template>
