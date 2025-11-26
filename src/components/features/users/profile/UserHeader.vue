<!-- src/components/features/user/profile/UserHeader.vue -->
<script setup lang="ts">
/**
 * UserHeader - Header с avatar и optional banner
 * Визуальный стиль из старого UserView.vue
 */

import { computed } from 'vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import UserStats from './UserStats.vue'
import UserBio from './UserBio.vue'
import UserSocialLinks from './UserSocialLinks.vue'
import UserActions from './UserActions.vue'

export interface UserHeaderProps {
  user: {
    id: string
    username: string
    description?: string | null
    instagram?: string | null
    tiktok?: string | null
    telegram?: string | null
    pinterest?: string | null
    verified?: boolean
  }
  avatarUrl?: string | null
  bannerUrl?: string | null
  followersCount: number
  followingCount: number
  isCurrentUser: boolean
  isFollowing?: boolean
  hasChat?: boolean
}

const props = defineProps<UserHeaderProps>()

const emit = defineEmits<{
  (e: 'showFollowers'): void
  (e: 'showFollowing'): void
  (e: 'showMoreBio'): void
  (e: 'sendMessage'): void
  (e: 'goToChat'): void
  (e: 'editProfile'): void
  (e: 'editImage'): void
  (e: 'editBanner'): void
}>()

const hasBanner = computed(() => !!props.bannerUrl)
</script>

<template>
  <!-- Without banner (centered layout) -->
  <div v-if="!hasBanner" class="flex flex-col items-center">
    <!-- Avatar with verified badge -->
    <div class="relative">
      <i v-if="user.verified" class="absolute top-0 left-28 pi pi-verified text-2xl" />
      <BaseAvatar
        :src="avatarUrl || undefined"
        :alt="user.username"
        size="xl"
        class="!w-32 !h-32 border-4 border-white"
      />
    </div>

    <!-- Username -->
    <p class="mt-4 text-3xl font-extrabold">{{ user.username }}</p>

    <!-- Bio -->
    <UserBio :description="user.description" @show-more="emit('showMoreBio')" />

    <!-- Social links -->
    <UserSocialLinks
      :instagram="user.instagram"
      :tiktok="user.tiktok"
      :telegram="user.telegram"
      :pinterest="user.pinterest"
      variant="inline"
    />

    <!-- Stats -->
    <UserStats
      :followers-count="followersCount"
      :following-count="followingCount"
      @show-followers="emit('showFollowers')"
      @show-following="emit('showFollowing')"
    />

    <!-- Actions -->
    <UserActions
      :user-id="user.id"
      :is-current-user="isCurrentUser"
      :is-following="isFollowing"
      :has-chat="hasChat"
      @send-message="emit('sendMessage')"
      @go-to-chat="emit('goToChat')"
      @edit-profile="emit('editProfile')"
    >
      <template #edit-buttons>
        <button
          @click="emit('editProfile')"
          class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
        >
          Information
        </button>
        <button
          @click="emit('editImage')"
          class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
        >
          Profile Image
        </button>
        <button
          @click="emit('editBanner')"
          class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
        >
          Banner
        </button>
      </template>
    </UserActions>
  </div>

  <!-- With banner (two column layout) -->
  <div v-else class="grid grid-cols-2 gap-6 px-4 py-6">
    <!-- Left column: User info -->
    <div class="ml-10">
      <!-- Avatar with username -->
      <div class="relative flex items-center">
        <i v-if="user.verified" class="absolute top-0 left-28 pi pi-verified text-2xl text-black" />
        <BaseAvatar
          :src="avatarUrl || undefined"
          :alt="user.username"
          size="xl"
          class="!w-32 !h-32"
        />
        <p class="ml-4 text-3xl font-extrabold text-gray-800">{{ user.username }}</p>
      </div>

      <!-- Stats -->
      <UserStats
        :followers-count="followersCount"
        :following-count="followingCount"
        variant="column"
        @show-followers="emit('showFollowers')"
        @show-following="emit('showFollowing')"
      />

      <!-- Bio -->
      <div class="mt-4">
        <p v-if="user.description" class="description-box mt-4 text-md w-[500px]">
          {{ user.description }}
        </p>
        <span
          v-if="user.description && user.description.length > 200"
          class="text-black cursor-pointer flex justify-left font-extrabold mt-2"
          @click="emit('showMoreBio')"
        >
          More
        </span>
      </div>

      <!-- Social links -->
      <UserSocialLinks
        :instagram="user.instagram"
        :tiktok="user.tiktok"
        :telegram="user.telegram"
        :pinterest="user.pinterest"
        variant="inline"
        class="justify-left"
      />

      <!-- Actions -->
      <UserActions
        :user-id="user.id"
        :is-current-user="isCurrentUser"
        :is-following="isFollowing"
        :has-chat="hasChat"
        class="justify-left"
        @send-message="emit('sendMessage')"
        @go-to-chat="emit('goToChat')"
        @edit-profile="emit('editProfile')"
      >
        <template #edit-buttons>
          <button
            @click="emit('editProfile')"
            class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
          >
            Information
          </button>
          <button
            @click="emit('editImage')"
            class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
          >
            Profile Image
          </button>
          <button
            @click="emit('editBanner')"
            class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
          >
            Banner
          </button>
        </template>
      </UserActions>
    </div>

    <!-- Right column: Banner -->
    <div class="flex items-center justify-center">
      <img :src="bannerUrl" alt="Banner" class="rounded-2xl h-[400px] w-[600px] object-cover" />
    </div>
  </div>
</template>

<style scoped>
.description-box {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}
</style>
