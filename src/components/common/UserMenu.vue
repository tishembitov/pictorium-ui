<script setup lang="ts">
import { ref } from 'vue'
import BasePopover from '@/components/ui/BasePopover.vue'
import UserAvatar from './UserAvatar.vue'

export interface UserMenuProps {
  user: {
    id: string
    username: string
    email?: string
    imageUrl?: string
  }
  userImage?: string
}

const props = defineProps<UserMenuProps>()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'settings'): void
  (e: 'profile'): void
}>()

const showMenu = ref(false)
</script>

<template>
  <BasePopover v-model="showMenu" position="bottom" trigger="click">
    <template #trigger>
      <UserAvatar :user="user" :image-url="userImage" size="md" :clickable="true" />
    </template>

    <div class="bg-white rounded-2xl shadow-2xl p-2 min-w-[200px]">
      <!-- User info -->
      <div class="px-4 py-3 border-b border-gray-200">
        <p class="font-semibold text-gray-900">{{ user.username }}</p>
        <p v-if="user.email" class="text-sm text-gray-500 truncate">{{ user.email }}</p>
      </div>

      <!-- Menu items -->
      <div class="py-2">
        <button
          @click="
            emit('profile')
            showMenu = false
          "
          class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
        >
          <i class="pi pi-user"></i>
          <span>Profile</span>
        </button>

        <button
          @click="
            emit('settings')
            showMenu = false
          "
          class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
        >
          <i class="pi pi-cog"></i>
          <span>Settings</span>
        </button>

        <hr class="my-2" />

        <button
          @click="
            emit('logout')
            showMenu = false
          "
          class="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center gap-2"
        >
          <i class="pi pi-sign-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </BasePopover>
</template>
