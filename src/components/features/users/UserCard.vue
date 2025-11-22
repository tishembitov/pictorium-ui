<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import FollowButton from './follow/FollowButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { storageApi } from '@/api/storage.api'
import type { User } from '@/types'

export interface UserCardProps {
  user: User
  showFollowButton?: boolean
  showStats?: boolean
}

const props = withDefaults(defineProps<UserCardProps>(), {
  showFollowButton: true,
  showStats: false,
})

const authStore = useAuthStore()
const userImage = ref<string | null>(null)

const isMe = computed(() => authStore.userId === props.user.id)

onMounted(async () => {
  if (props.user.imageUrl) {
    try {
      const blob = await storageApi.downloadImage(props.user.imageUrl)
      userImage.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('[UserCard] Avatar load failed:', error)
    }
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
    <RouterLink :to="`/user/${user.username}`" class="flex flex-col items-center text-center group">
      <!-- Avatar -->
      <div class="relative mb-4">
        <UserAvatar
          :user="user"
          :image-url="userImage"
          size="xl"
          class="group-hover:scale-105 transition-transform duration-200"
        />
        <i
          v-if="user.verified"
          class="absolute -top-1 -right-1 pi pi-verified text-blue-500 text-xl"
        ></i>
      </div>

      <!-- Username -->
      <h3 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition">
        {{ user.username }}
      </h3>

      <!-- Description -->
      <p v-if="user.description" class="text-sm text-gray-600 line-clamp-2 mb-4">
        {{ user.description }}
      </p>

      <!-- Stats -->
      <div v-if="showStats" class="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span>{{ user.followersCount || 0 }} followers</span>
        <span>{{ user.pinsCount || 0 }} pins</span>
      </div>
    </RouterLink>

    <!-- Follow Button -->
    <FollowButton
      v-if="showFollowButton && !isMe"
      :user-id="user.id"
      size="sm"
      class="w-full mt-4"
    />
  </div>
</template>
