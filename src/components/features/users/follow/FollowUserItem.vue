<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import FollowButton from './FollowButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { storageApi } from '@/api/storage.api'
import type { User } from '@/types'

export interface FollowUserItemProps {
  user: User
  showFollowButton?: boolean
}

const props = withDefaults(defineProps<FollowUserItemProps>(), {
  showFollowButton: true,
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
      console.error('[FollowUserItem] Avatar load failed:', error)
    }
  }
})
</script>

<template>
  <div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-2xl transition">
    <RouterLink
      :to="`/user/${user.username}`"
      class="flex items-center gap-3 flex-1 hover:opacity-80 transition"
    >
      <UserAvatar :user="user" :image-url="userImage" size="md" />

      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-900 truncate">{{ user.username }}</span>
          <i v-if="user.verified" class="pi pi-verified text-blue-500 text-sm"></i>
        </div>
        <p v-if="user.description" class="text-sm text-gray-500 truncate max-w-xs">
          {{ user.description }}
        </p>
      </div>
    </RouterLink>

    <FollowButton v-if="showFollowButton && !isMe" :user-id="user.id" size="sm" />
  </div>
</template>
