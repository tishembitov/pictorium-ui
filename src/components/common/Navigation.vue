<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import NotificationBadge from './NotificationBadge.vue'

export interface NavigationProps {
  user?: {
    id: string
    username: string
    imageUrl?: string
  }
  userImage?: string
  unreadMessages?: number
  unreadUpdates?: number
}

const props = defineProps<NavigationProps>()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'createPin'): void
  (e: 'openUpdates'): void
}>()

const route = useRoute()

const isActive = (name: string) => {
  return route.name === name
}

const totalUnread = computed(() => {
  return (props.unreadMessages || 0) + (props.unreadUpdates || 0)
})
</script>

<template>
  <aside
    class="fixed top-0 left-0 h-screen w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 z-50"
  >
    <!-- Logo -->
    <RouterLink to="/" class="mb-8 text-4xl hover:scale-110 transition-transform"> 🐰 </RouterLink>

    <!-- Navigation items -->
    <nav class="flex-1 flex flex-col items-center space-y-6">
      <!-- Home -->
      <RouterLink
        to="/"
        :class="[
          'relative p-3 rounded-2xl transition-all hover:bg-gray-100',
          isActive('home') && 'bg-black',
        ]"
        title="Home"
      >
        <i :class="['pi pi-home text-2xl', isActive('home') ? 'text-white' : 'text-gray-700']"></i>
      </RouterLink>

      <!-- Messages -->
      <RouterLink
        to="/messages"
        :class="[
          'relative p-3 rounded-2xl transition-all hover:bg-gray-100',
          isActive('messages') && 'bg-black',
        ]"
        title="Messages"
      >
        <i
          :class="[
            'pi pi-comments text-2xl',
            isActive('messages') ? 'text-white' : 'text-gray-700',
          ]"
        ></i>
        <NotificationBadge
          v-if="unreadMessages"
          :count="unreadMessages"
          class="absolute -top-1 -right-1"
        />
      </RouterLink>

      <!-- Create Pin -->
      <button
        @click="emit('createPin')"
        class="p-3 rounded-2xl transition-all hover:bg-gray-100"
        title="Create Pin"
      >
        <i class="pi pi-plus text-2xl text-gray-700"></i>
      </button>

      <!-- Updates/Notifications (кнопка вместо ссылки) -->
      <button
        @click="emit('openUpdates')"
        class="relative p-3 rounded-2xl transition-all hover:bg-gray-100"
        title="Updates"
      >
        <i class="pi pi-bell text-2xl text-gray-700"></i>
        <NotificationBadge
          v-if="unreadUpdates"
          :count="unreadUpdates"
          class="absolute -top-1 -right-1"
        />
      </button>
    </nav>

    <!-- User profile -->
    <div class="mt-auto space-y-4 flex flex-col items-center">
      <!-- User avatar -->
      <RouterLink
        v-if="user"
        :to="`/user/${user.username}`"
        :class="[
          'p-1 rounded-2xl transition-all',
          isActive('user') && route.params.username === user.username && 'ring-2 ring-black',
        ]"
        title="Profile"
      >
        <BaseAvatar :src="userImage" :alt="user.username" size="lg" />
      </RouterLink>

      <!-- Logout -->
      <button
        @click="emit('logout')"
        class="p-3 rounded-2xl transition-all hover:bg-red-100"
        title="Logout"
      >
        <i class="pi pi-sign-out text-2xl text-red-600"></i>
      </button>
    </div>
  </aside>
</template>
