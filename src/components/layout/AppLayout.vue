<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from '@/components/common/Navigation.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

const route = useRoute()

const showScrollToTop = computed(() => {
  // Показываем ScrollToTop на всех страницах кроме Messages
  return route.name !== 'messages'
})

onMounted(() => {
  // Инициализация при монтировании
  if (authStore.isAuthenticated) {
    notificationsStore.connect()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <Navigation
      :user="authStore.user"
      :user-image="authStore.userImage"
      :unread-messages="notificationsStore.unreadMessages"
      :unread-updates="notificationsStore.unreadUpdates"
      @logout="authStore.logout"
      @create-pin="() => $router.push('/create-pin')"
    />

    <!-- Main Content -->
    <main class="ml-20 min-h-screen">
      <slot />
    </main>

    <!-- Scroll to Top -->
    <ScrollToTop v-if="showScrollToTop" />
  </div>
</template>
