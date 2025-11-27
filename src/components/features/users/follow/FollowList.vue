<!-- src/components/features/users/follow/FollowList.vue -->
<script setup lang="ts">
/**
 * FollowList - Список с infinite scroll
 * ✅ ИСПРАВЛЕНО: использует useInfiniteScroll, useUsersWithAvatars
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useUsersWithAvatars } from '@/composables/api/useUsersWithAvatars'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'
import FollowUserItem from './FollowUserItem.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface FollowListProps {
  userId: string
  type: 'followers' | 'following'
  pageSize?: number
}

const props = withDefaults(defineProps<FollowListProps>(), {
  pageSize: 10,
})

// Stores & Composables
const store = useSubscriptionsStore()
const { loadUsers: loadUserAvatars, getUser, isLoading: isLoadingAvatars } = useUsersWithAvatars()

// Refs
const triggerRef = ref<HTMLElement | null>(null)

// Computed - данные из store
const users = computed(() =>
  props.type === 'followers' ? store.getFollowers(props.userId) : store.getFollowing(props.userId),
)

const hasMore = computed(() =>
  props.type === 'followers'
    ? store.hasMoreFollowers(props.userId)
    : store.hasMoreFollowing(props.userId),
)

const isLoadingFromStore = computed(() =>
  props.type === 'followers' ? store.isLoadingFollowers : store.isLoadingFollowing,
)

const isLoading = computed(() => isLoadingFromStore.value || isLoadingAvatars.value)

const isEmpty = computed(() => !isLoading.value && users.value.length === 0)

// ✅ Infinite scroll с composable
const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMore, {
  distance: 100,
  disabled: computed(() => !hasMore.value || isLoading.value),
})

// Load more function
async function loadMore() {
  if (props.type === 'followers') {
    await store.loadMoreFollowers(props.userId)
  } else {
    await store.loadMoreFollowing(props.userId)
  }

  // Load avatars for new users
  const userIds = users.value.map((u) => u.id)
  await loadUserAvatars(userIds)
}

// Initial load
async function initialLoad() {
  if (props.type === 'followers') {
    await store.fetchFollowers(props.userId, 0, props.pageSize, true)
  } else {
    await store.fetchFollowing(props.userId, 0, props.pageSize, true)
  }

  // Load avatars
  const userIds = users.value.map((u) => u.id)
  await loadUserAvatars(userIds)
}

// Lifecycle
onMounted(() => {
  initialLoad()
})

// Reset on userId change
watch(
  () => props.userId,
  () => {
    initialLoad()
  },
)
</script>

<template>
  <div class="overflow-y-auto max-h-[500px] px-2">
    <!-- Users list -->
    <FollowUserItem
      v-for="user in users"
      :key="user.id"
      :user="user"
      :avatar-blob-url="getUser(user.id).image"
    />

    <!-- Trigger element for infinite scroll -->
    <div ref="triggerRef" class="h-4" />

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center py-4">
      <BaseLoader variant="spinner" size="sm" />
    </div>

    <!-- Empty state -->
    <div v-if="isEmpty" class="text-center py-8 text-gray-400">
      <p>{{ type === 'followers' ? 'No followers yet' : 'Not following anyone yet' }}</p>
    </div>
  </div>
</template>
