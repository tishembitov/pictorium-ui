<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import UserStats from './UserStats.vue'
import UserBio from './UserBio.vue'
import UserSocialLinks from './UserSocialLinks.vue'
import UserActions from './UserActions.vue'
import { storageApi } from '@/api/storage.api'
import type { User } from '@/types'

export interface UserHeaderProps {
  user: User
  followersCount: number
  followingCount: number
  pinsCount?: number
  hasChat?: boolean
  layout?: 'default' | 'with-banner'
}

const props = withDefaults(defineProps<UserHeaderProps>(), {
  pinsCount: 0,
  hasChat: false,
  layout: 'default',
})

const emit = defineEmits<{
  (e: 'followers-click'): void
  (e: 'following-click'): void
  (e: 'edit-profile'): void
  (e: 'send-message'): void
  (e: 'go-to-chat'): void
  (e: 'edit-banner'): void
}>()

const userImage = ref<string | null>(null)
const bannerImage = ref<string | null>(null)
const isLoadingImages = ref(true)

onMounted(async () => {
  try {
    // Load avatar
    if (props.user.imageUrl) {
      const avatarBlob = await storageApi.downloadImage(props.user.imageUrl)
      userImage.value = URL.createObjectURL(avatarBlob)
    }

    // Load banner
    if (props.user.bannerImageUrl) {
      const bannerBlob = await storageApi.downloadImage(props.user.bannerImageUrl)
      bannerImage.value = URL.createObjectURL(bannerBlob)
    }
  } catch (error) {
    console.error('[UserHeader] Load images failed:', error)
  } finally {
    isLoadingImages.value = false
  }
})

const hasBanner = computed(() => !!bannerImage.value)
</script>

<template>
  <!-- Layout with Banner (2 columns) -->
  <div v-if="layout === 'with-banner' && hasBanner" class="grid grid-cols-2 gap-6 px-4 py-6">
    <!-- Left Column: Profile Info -->
    <div class="flex flex-col">
      <!-- Avatar + Username -->
      <div class="flex items-center gap-4">
        <div class="relative">
          <i
            v-if="user.verified"
            class="absolute -top-1 -right-1 pi pi-verified text-blue-500 text-2xl z-10"
          ></i>
          <UserAvatar :user="user" :image-url="userImage" size="xl" />
        </div>

        <h1 class="text-3xl font-bold text-gray-900">{{ user.username }}</h1>
      </div>

      <!-- Stats -->
      <UserStats
        :followers-count="followersCount"
        :following-count="followingCount"
        :pins-count="pinsCount"
        class="mt-4"
        @followers-click="emit('followers-click')"
        @following-click="emit('following-click')"
      />

      <!-- Bio -->
      <UserBio :description="user.description" class="mt-4" />

      <!-- Social Links -->
      <UserSocialLinks
        :instagram="user.instagram"
        :tiktok="user.tiktok"
        :telegram="user.telegram"
        :pinterest="user.pinterest"
        class="mt-4"
      />

      <!-- Actions -->
      <UserActions
        :user-id="user.id"
        :username="user.username"
        :has-chat="hasChat"
        @edit-profile="emit('edit-profile')"
        @send-message="emit('send-message')"
        @go-to-chat="emit('go-to-chat')"
      />
    </div>

    <!-- Right Column: Banner -->
    <div class="flex items-center justify-center">
      <div class="relative group">
        <img
          v-if="bannerImage"
          :src="bannerImage"
          alt="Profile Banner"
          class="rounded-2xl h-[400px] w-[600px] object-cover shadow-lg"
        />

        <!-- Edit Banner Button (visible on hover) -->
        <button
          v-if="$slots['edit-banner']"
          @click="emit('edit-banner')"
          class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center"
        >
          <i class="pi pi-camera text-white text-4xl"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Default Layout (centered) -->
  <div v-else class="flex flex-col items-center text-center py-6">
    <!-- Avatar -->
    <div class="relative">
      <i
        v-if="user.verified"
        class="absolute -top-1 left-28 pi pi-verified text-blue-500 text-2xl z-10"
      ></i>
      <UserAvatar :user="user" :image-url="userImage" size="xl" />
    </div>

    <!-- Username -->
    <h1 class="mt-4 text-3xl font-bold text-gray-900">{{ user.username }}</h1>

    <!-- Bio -->
    <UserBio :description="user.description" class="mt-4 max-w-lg" />

    <!-- Social Links (compact) -->
    <UserSocialLinks
      :instagram="user.instagram"
      :tiktok="user.tiktok"
      :telegram="user.telegram"
      :pinterest="user.pinterest"
      compact
      class="mt-4"
    />

    <!-- Stats -->
    <UserStats
      :followers-count="followersCount"
      :following-count="followingCount"
      :pins-count="pinsCount"
      class="mt-4"
      @followers-click="emit('followers-click')"
      @following-click="emit('following-click')"
    />

    <!-- Actions -->
    <UserActions
      :user-id="user.id"
      :username="user.username"
      :has-chat="hasChat"
      @edit-profile="emit('edit-profile')"
      @send-message="emit('send-message')"
      @go-to-chat="emit('go-to-chat')"
    />
  </div>
</template>
