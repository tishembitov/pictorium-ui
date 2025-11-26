<!-- src/components/features/user/profile/AboutUserModal.vue -->
<script setup lang="ts">
/**
 * AboutUserModal - Модалка "About user" с полным описанием
 * Визуальный стиль из старого UserView.vue (showModal)
 */

import { computed } from 'vue'
import { useEscapeKey } from '@/composables/utils/useClickOutside'
import UserSocialLinks from './UserSocialLinks.vue'
import FollowButton from '../follow/FollowButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface AboutUserModalProps {
  modelValue: boolean
  user: {
    id: string
    username: string
    description?: string | null
    instagram?: string | null
    tiktok?: string | null
    telegram?: string | null
    pinterest?: string | null
  }
  followersCount: number
  followingCount: number
  isCurrentUser: boolean
  isFollowing?: boolean
  hasChat?: boolean
}

const props = defineProps<AboutUserModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'showFollowers'): void
  (e: 'showFollowing'): void
  (e: 'sendMessage'): void
  (e: 'goToChat'): void
  (e: 'follow'): void
  (e: 'unfollow'): void
}>()

function close() {
  emit('update:modelValue', false)
}

// Escape key
const isOpen = computed(() => props.modelValue)
useEscapeKey(close, { enabled: isOpen })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40"
      @click.self="close"
    >
      <div class="bg-white p-6 rounded-2xl w-[550px] relative h-[700px] ml-20">
        <!-- Close button -->
        <button @click="close" class="absolute top-10 right-10 text-gray-500 hover:text-black">
          ✕
        </button>

        <!-- Title -->
        <h2 class="text-4xl font-bold mb-4 mt-10 px-4 py-7">About user {{ user.username }}</h2>

        <!-- Scrollable content -->
        <div class="overflow-y-auto max-h-[400px] mt-10">
          <!-- Social links -->
          <UserSocialLinks
            :instagram="user.instagram"
            :tiktok="user.tiktok"
            :telegram="user.telegram"
            :pinterest="user.pinterest"
            variant="full"
          />

          <!-- Stats -->
          <div class="space-y-6 px-4">
            <a
              v-if="followersCount > 0"
              @click="emit('showFollowers')"
              class="text-black block w-full cursor-pointer hover:underline font-extrabold"
            >
              <i class="pi pi-user-plus mr-5" /> {{ followersCount }} follower{{
                followersCount !== 1 ? 's' : ''
              }}
            </a>

            <a
              v-if="followingCount > 0"
              @click="emit('showFollowing')"
              class="text-black block w-full cursor-pointer hover:underline font-extrabold"
            >
              <i class="pi pi-users mr-5" /> {{ followingCount }} following
            </a>
          </div>

          <!-- Description -->
          <p class="text-gray-800 whitespace-pre-line px-4 py-7">
            {{ user.description }}
          </p>
        </div>

        <!-- Bottom actions -->
        <div v-if="!isCurrentUser" class="absolute bottom-6 right-6">
          <FollowButton :user-id="user.id" :initial-following="isFollowing" />
        </div>

        <div v-if="!isCurrentUser" class="absolute bottom-6 left-6">
          <BaseButton
            v-if="!hasChat"
            @click="emit('sendMessage')"
            variant="secondary"
            class="!bg-gray-300 !text-black hover:!bg-gray-400"
          >
            Send Message
          </BaseButton>
          <BaseButton
            v-else
            @click="emit('goToChat')"
            variant="secondary"
            class="!bg-gray-300 !text-black hover:!bg-gray-400"
          >
            Go to Chat
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
