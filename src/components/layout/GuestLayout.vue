<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  // Если пользователь авторизован, редиректим на главную
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <slot />
  </div>
</template>
