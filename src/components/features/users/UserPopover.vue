<!-- src/components/features/user/UserPopover.vue -->
<script setup lang="ts">
/**
 * UserPopover - Popover при hover на username
 * Используется в PinCard и комментариях
 */

import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useFollow } from '@/composables/api/useFollow'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import FollowButton from './follow/FollowButton.vue'

export interface UserPopoverProps {
  userId: string
  position?: 'top' | 'bottom'
}

const props = withDefaults(defineProps<UserPopoverProps>(), {
  position: 'bottom',
})

const emit = defineEmits<{
  (e: 'showFollowers'): void
  (e: 'showFollowing'): void
}>()

// Stores
const userStore = useUserStore()
const subscriptionsStore = useSubscriptionsStore()

// State
const user = ref<any>(null)
const avatarUrl = ref<string | null>(null)
const isLoading = ref(true)

// Composable
const { isFollowing, check } = useFollow(props.userId)

// Computed
const isCurrentUser = computed(() => userStore.userId === props.userId)
const followersCount = computed(() => subscriptionsStore.getFollowers(props.userId)?.length || 0)
const followingCount = computed(() => subscriptionsStore.getFollowing(props.userId)?.length || 0)

// Load user data
onMounted(async () => {
  try {
    user.value = await userStore.loadUserById(props.userId)
    avatarUrl.value = userStore.getAvatarUrl(props.userId) || null

    if (!isCurrentUser.value) {
      await check()
    }

    // Load follower counts
    await Promise.all([
      subscriptionsStore.fetchFollowers(props.userId, 0, 1),
      subscriptionsStore.fetchFollowing(props.userId, 0, 1),
    ])
  } catch (error) {
    console.error('[UserPopover] Failed to load user:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div
    class="bg-white bg-opacity-20 backdrop-blur-md rounded-3xl font-medium text-white z-30 w-[271px] shadow-xl"
    :class="position === 'top' ? 'bottom-10' : 'top-10'"
  >
    <div class="relative flex flex-col items-center justify-center py-6 px-4">
      <!-- Loading -->
      <div v-if="isLoading" class="py-8">
        <div class="w-20 h-20 bg-gray-300 rounded-full animate-pulse mb-3" />
        <div class="w-24 h-4 bg-gray-300 rounded animate-pulse" />
      </div>

      <!-- Content -->
      <template v-else-if="user">
        <!-- Avatar -->
        <RouterLink
          :to="`/user/${user.username}`"
          class="relative transition-transform duration-200 transform hover:scale-110"
        >
          <i
            v-if="user.verified"
            class="absolute -top-1 -right-1 pi pi-verified text-xl text-blue-400"
          />
          <BaseAvatar
            :src="avatarUrl || user.imageUrl"
            :alt="user.username"
            size="xl"
            class="border-2 border-red-500 !w-20 !h-20"
          />
        </RouterLink>

        <!-- Username -->
        <RouterLink
          :to="`/user/${user.username}`"
          class="mt-2 text-xl font-bold hover:underline"
          style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6)"
        >
          {{ user.username }}
        </RouterLink>

        <!-- Stats -->
        <div class="flex gap-4 mt-1 text-sm">
          <button
            v-if="followersCount > 0"
            @click.prevent="emit('showFollowers')"
            class="hover:underline cursor-pointer transition-transform hover:scale-105"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6)"
          >
            {{ followersCount }} followers
          </button>
          <button
            v-if="followingCount > 0"
            @click.prevent="emit('showFollowing')"
            class="hover:underline cursor-pointer transition-transform hover:scale-105"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6)"
          >
            {{ followingCount }} following
          </button>
        </div>

        <!-- Follow button -->
        <div v-if="!isCurrentUser" class="absolute top-2 right-2">
          <FollowButton :user-id="userId" size="sm" variant="minimal" />
        </div>
      </template>
    </div>
  </div>
</template>
