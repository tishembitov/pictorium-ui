<!-- src/components/features/user/follow/FollowList.vue -->
<script setup lang="ts">
/**
 * FollowList - Список с пагинацией при скролле
 * Использует: useSubscriptionsStore, scroll handler
 * Визуальный стиль из старого FollowersSection.vue
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useUserStore } from '@/stores/user.store'
import FollowUserItem from './FollowUserItem.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface FollowListProps {
  userId: string
  type: 'followers' | 'following'
  pageSize?: number
}

const props = withDefaults(defineProps<FollowListProps>(), {
  pageSize: 7,
})

// Stores
const subscriptionsStore = useSubscriptionsStore()
const userStore = useUserStore()

// State
const users = ref<Array<{ id: string; username: string; imageUrl?: string; image?: string }>>([])
const page = ref(0)
const isLoading = ref(false)
const canLoad = ref(true)

// Load users with avatars
async function loadUsers() {
  if (isLoading.value || !canLoad.value) return

  isLoading.value = true

  try {
    let response: any[]

    if (props.type === 'followers') {
      response = await subscriptionsStore.fetchFollowers(
        props.userId,
        page.value,
        props.pageSize,
        page.value === 0,
      )
    } else {
      response = await subscriptionsStore.fetchFollowing(
        props.userId,
        page.value,
        props.pageSize,
        page.value === 0,
      )
    }

    if (response.length < props.pageSize) {
      canLoad.value = false
    }

    // Load avatars for each user
    for (const user of response) {
      let avatarUrl: string | undefined

      try {
        avatarUrl = await userStore.loadUserAvatarById(user.id, user.imageUrl)
      } catch (error) {
        console.error('[FollowList] Failed to load avatar:', error)
      }

      users.value.push({
        id: user.id,
        username: user.username,
        imageUrl: user.imageUrl,
        image: avatarUrl || undefined,
      })
    }

    page.value++
  } catch (error) {
    console.error('[FollowList] Failed to load users:', error)
  } finally {
    isLoading.value = false
  }
}

// Scroll handler (как в старом проекте)
function handleScroll(event: Event) {
  const container = event.target as HTMLElement
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
    loadUsers()
  }
}

// Initial load
onMounted(() => {
  loadUsers()
})

// Reset on userId change
watch(
  () => props.userId,
  () => {
    users.value = []
    page.value = 0
    canLoad.value = true
    loadUsers()
  },
)
</script>

<template>
  <div @scroll="handleScroll" class="overflow-y-auto max-h-[500px]">
    <FollowUserItem
      v-for="user in users"
      :key="user.id"
      :user="user"
      :avatar-blob-url="user.image"
    />

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center py-4">
      <BaseLoader variant="spinner" size="sm" />
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && users.length === 0" class="text-center py-8 text-gray-500">
      <p>{{ type === 'followers' ? 'No followers yet' : 'Not following anyone yet' }}</p>
    </div>
  </div>
</template>
