<!-- src/components/features/users/profile/AboutUserModal.vue -->
<script setup lang="ts">
/**
 * AboutUserModal - Модалка "About user"
 * ✅ ИСПРАВЛЕНО: унифицированы emits, использует composables
 */

import { computed } from 'vue'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import UserSocialLinks from './UserSocialLinks.vue'
import FollowButton from '../follow/FollowButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { User } from '@/types'

export interface AboutUserModalProps {
  modelValue: boolean
  user: Pick<
    User,
    'id' | 'username' | 'description' | 'instagram' | 'tiktok' | 'telegram' | 'pinterest'
  >
  followersCount: number
  followingCount: number
  isCurrentUser: boolean
  isFollowing?: boolean
  hasChat?: boolean
}

const props = defineProps<AboutUserModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  showFollowers: []
  showFollowing: []
  sendMessage: []
  goToChat: []
  follow: []
  unfollow: []
}>()

// v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Scroll lock
useScrollLock(isOpen)

function close() {
  isOpen.value = false
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-40"
        @click="handleBackdropClick"
        @keydown.escape="close"
      >
        <div class="bg-white p-6 rounded-2xl w-[550px] relative max-h-[700px] ml-20">
          <!-- Close button -->
          <button
            @click="close"
            class="absolute top-6 right-6 text-gray-500 hover:text-black transition"
            aria-label="Close"
          >
            <i class="pi pi-times text-xl" />
          </button>

          <!-- Title -->
          <h2 class="text-3xl font-bold mb-6 mt-4 px-4">About {{ user.username }}</h2>

          <!-- Scrollable content -->
          <div class="overflow-y-auto max-h-[450px] mt-6">
            <!-- Social links -->
            <UserSocialLinks
              :instagram="user.instagram"
              :tiktok="user.tiktok"
              :telegram="user.telegram"
              :pinterest="user.pinterest"
              variant="full"
            />

            <!-- Stats -->
            <div class="space-y-4 px-4 mt-6">
              <button
                v-if="followersCount > 0"
                @click="emit('showFollowers')"
                class="text-black block w-full text-left cursor-pointer hover:underline font-extrabold transition"
              >
                <i class="pi pi-user-plus mr-4" />
                {{ followersCount }} follower{{ followersCount !== 1 ? 's' : '' }}
              </button>

              <button
                v-if="followingCount > 0"
                @click="emit('showFollowing')"
                class="text-black block w-full text-left cursor-pointer hover:underline font-extrabold transition"
              >
                <i class="pi pi-users mr-4" />
                {{ followingCount }} following
              </button>
            </div>

            <!-- Description -->
            <p v-if="user.description" class="text-gray-800 whitespace-pre-line px-4 py-6">
              {{ user.description }}
            </p>
          </div>

          <!-- Bottom actions -->
          <div v-if="!isCurrentUser" class="flex justify-between items-center mt-6 px-4">
            <BaseButton v-if="!hasChat" @click="emit('sendMessage')" variant="secondary">
              Send Message
            </BaseButton>
            <BaseButton v-else @click="emit('goToChat')" variant="secondary">
              Go to Chat
            </BaseButton>

            <FollowButton :user-id="user.id" :initial-following="isFollowing" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
