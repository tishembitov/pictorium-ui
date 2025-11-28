<!-- src/components/features/users/profile/UserHeader.vue -->
<script setup lang="ts">
/**
 * UserHeader - Header с avatar и optional banner
 * ✅ Чистый presentational компонент
 */

import { computed } from 'vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import UserStats from './UserStats.vue'
import UserBio from './UserBio.vue'
import UserSocialLinks from './UserSocialLinks.vue'
import UserActions from './UserActions.vue'
import type { User } from '@/types'

export interface UserHeaderProps {
  user: Pick<
    User,
    'id' | 'username' | 'description' | 'instagram' | 'tiktok' | 'telegram' | 'pinterest'
  >
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
  showFollowers: []
  showFollowing: []
  showMoreBio: []
  sendMessage: []
  goToChat: []
  editProfile: []
  editImage: []
  editBanner: []
}>()

const hasBanner = computed(() => !!props.bannerUrl)
</script>

<template>
  <!-- Without banner (centered layout) -->
  <div v-if="!hasBanner" class="flex flex-col items-center">
    <!-- Avatar with verified badge -->
    <div class="relative">
      <BaseAvatar
        :src="avatarUrl || undefined"
        :alt="user.username"
        size="xl"
        class="!w-32 !h-32 border-4 border-white shadow-lg"
      />
    </div>

    <!-- Username -->
    <h1 class="mt-4 text-3xl font-extrabold">{{ user.username }}</h1>

    <!-- Bio -->
    <UserBio :description="user.description" @show-more="emit('showMoreBio')" />

    <!-- Social links -->
    <UserSocialLinks
      :instagram="user.instagram"
      :tiktok="user.tiktok"
      :telegram="user.telegram"
      :pinterest="user.pinterest"
      variant="inline"
      class="mt-2"
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
  <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 py-6">
    <!-- Left column: User info -->
    <div class="lg:ml-10">
      <!-- Avatar with username -->
      <div class="relative flex items-center">
        <BaseAvatar
          :src="avatarUrl || undefined"
          :alt="user.username"
          size="xl"
          class="!w-32 !h-32"
        />
        <h1 class="ml-4 text-3xl font-extrabold text-gray-800">
          {{ user.username }}
        </h1>
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
        <p v-if="user.description" class="description-box text-md max-w-[500px]">
          {{ user.description }}
        </p>
        <button
          v-if="user.description && user.description.length > 200"
          @click="emit('showMoreBio')"
          class="text-black font-extrabold mt-2 hover:underline"
        >
          More
        </button>
      </div>

      <!-- Social links -->
      <UserSocialLinks
        :instagram="user.instagram"
        :tiktok="user.tiktok"
        :telegram="user.telegram"
        :pinterest="user.pinterest"
        variant="inline"
        class="mt-4"
      />

      <!-- Actions -->
      <UserActions
        :user-id="user.id"
        :is-current-user="isCurrentUser"
        :is-following="isFollowing"
        :has-chat="hasChat"
        class="mt-4"
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
      <img
        :src="bannerUrl!"
        alt="Banner"
        class="rounded-2xl h-[400px] w-full max-w-[600px] object-cover shadow-lg"
      />
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
