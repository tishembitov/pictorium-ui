<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { storageApi } from '@/api/storage.api'
import type { User } from '@/types'

export interface UserSearchItemProps {
  user: User
  query?: string
}

const props = defineProps<UserSearchItemProps>()

const userImage = ref<string | null>(null)

// Highlight matching text
const highlightText = (text: string, query?: string) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

onMounted(async () => {
  if (props.user.imageUrl) {
    try {
      const blob = await storageApi.downloadImage(props.user.imageUrl)
      userImage.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('[UserSearchItem] Avatar load failed:', error)
    }
  }
})
</script>

<template>
  <RouterLink
    :to="`/user/${user.username}`"
    class="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition group"
  >
    <!-- Avatar -->
    <div class="relative flex-shrink-0">
      <UserAvatar :user="user" :image-url="userImage" size="lg" />
      <i
        v-if="user.verified"
        class="absolute -top-1 -right-1 pi pi-verified text-blue-500 text-lg"
      ></i>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <!-- Username -->
      <h3
        class="font-bold text-gray-900 mb-1 group-hover:text-red-600 transition"
        v-html="highlightText(user.username, query)"
      ></h3>

      <!-- Description -->
      <p v-if="user.description" class="text-sm text-gray-600 line-clamp-2">
        {{ user.description }}
      </p>

      <!-- Stats -->
      <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span v-if="user.followersCount">{{ user.followersCount }} followers</span>
        <span v-if="user.pinsCount">{{ user.pinsCount }} pins</span>
      </div>
    </div>

    <!-- Arrow -->
    <i class="pi pi-chevron-right text-gray-400 group-hover:text-gray-600 transition"></i>
  </RouterLink>
</template>
